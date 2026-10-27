// app.js — connects the UI to the API (api.js) and the pure helpers (utils.js).
// Loaded last, so getAssignments(), computeStats(), etc. are available on the global scope.

const state = {
  assignments: [],
  filters: { course: "all", status: "all" },
  editingId: null,
};

const els = {
  statTotal: document.getElementById("stat-total"),
  statDone: document.getElementById("stat-done"),
  statDueSoon: document.getElementById("stat-duesoon"),
  statAvg: document.getElementById("stat-avg"),
  studyTotal: document.getElementById("study-total"),
  studyByCourse: document.getElementById("study-by-course"),
  form: document.getElementById("assignment-form"),
  formTitle: document.getElementById("form-title"),
  fId: document.getElementById("f-id"),
  fTitle: document.getElementById("f-title"),
  fCourse: document.getElementById("f-course"),
  fDueDate: document.getElementById("f-dueDate"),
  fPlannedHours: document.getElementById("f-plannedHours"),
  fProgress: document.getElementById("f-progress"),
  fProgressVal: document.getElementById("f-progress-val"),
  fStatus: document.getElementById("f-status"),
  submitBtn: document.getElementById("form-submit"),
  cancelBtn: document.getElementById("form-cancel"),
  courseSuggestions: document.getElementById("course-suggestions"),
  filterCourse: document.getElementById("filter-course"),
  filterStatus: document.getElementById("filter-status"),
  list: document.getElementById("assignment-list"),
  loading: document.getElementById("loading"),
  emptyState: document.getElementById("empty-state"),
  toast: document.getElementById("toast"),
};

// --- small UI helpers ---
let toastTimer = null;
function showToast(message, type = "info") {
  els.toast.textContent = message;
  els.toast.className = "toast" + (type === "error" ? " error" : "");
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 3200);
}

function setLoading(isLoading) {
  els.loading.hidden = !isLoading;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// --- data loading (GET) ---
async function load() {
  setLoading(true);
  try {
    state.assignments = await getAssignments();
    render();
  } catch (err) {
    showToast("Couldn't reach the server. Did you run 'npm run server'?", "error");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// --- rendering ---
function render() {
  renderStats();
  renderStudy();
  renderCourseOptions();
  renderList();
}

function renderStats() {
  const s = computeStats(state.assignments);
  els.statTotal.textContent = s.total;
  els.statDone.textContent = s.done;
  els.statDueSoon.textContent = s.dueSoon + s.overdue;
  els.statAvg.textContent = s.avgProgress + "%";
}

function renderStudy() {
  els.studyTotal.textContent = totalPlannedHours(state.assignments) + " hrs";
  const byCourse = studyHoursByCourse(state.assignments);
  const entries = Object.keys(byCourse);
  els.studyByCourse.innerHTML = entries.length
    ? entries.map((c) => `<li>${escapeHtml(c)}: ${byCourse[c]} hrs</li>`).join("")
    : `<li style="background:none;color:var(--muted);padding-left:0">No study time planned yet.</li>`;
}

function renderCourseOptions() {
  const courses = [...new Set(state.assignments.map((a) => a.course))].sort();
  // Filter dropdown (preserve current choice).
  const current = state.filters.course;
  els.filterCourse.innerHTML =
    `<option value="all">All courses</option>` +
    courses.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  els.filterCourse.value = courses.includes(current) ? current : "all";
  state.filters.course = els.filterCourse.value;
  // Autocomplete suggestions for the form.
  els.courseSuggestions.innerHTML = courses.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
}

function renderList() {
  const filtered = sortByDueDate(filterAssignments(state.assignments, state.filters));
  els.emptyState.hidden = filtered.length > 0;
  els.list.innerHTML = filtered.map(cardHtml).join("");
}

function cardHtml(a) {
  const isDone = a.status === "done";
  const dStatus = isDone ? "done" : deadlineStatus(a.dueDate);
  const badgeText = {
    "overdue": "Overdue",
    "due-soon": "Due soon",
    "upcoming": "Upcoming",
    "done": "Done",
  }[dStatus];
  const progress = clampProgress(a.progress);

  return `
    <li class="assignment ${isDone ? "is-done" : ""}" data-id="${a.id}">
      <div class="assignment-top">
        <div>
          <h3 class="assignment-title">${escapeHtml(a.title)}</h3>
          <span class="assignment-course">${escapeHtml(a.course)} · ${a.plannedHours || 0} hrs planned</span>
        </div>
        <span class="badge badge-${dStatus}">${badgeText}</span>
      </div>
      <div class="assignment-meta">
        <span>Due ${formatDate(a.dueDate)}</span>
        <span>${progress}% · ${statusLabel(a.status)}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="assignment-controls">
        <input type="range" min="0" max="100" step="5" value="${progress}"
               data-action="progress" data-id="${a.id}" aria-label="Update progress" />
        ${isDone ? "" : `<button class="btn btn-sm btn-primary" data-action="done" data-id="${a.id}">Mark done</button>`}
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${a.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${a.id}">Delete</button>
      </div>
    </li>`;
}

// --- form handling (POST / PUT) ---
function readForm() {
  return {
    title: els.fTitle.value.trim(),
    course: els.fCourse.value.trim(),
    dueDate: els.fDueDate.value,
    plannedHours: Number(els.fPlannedHours.value) || 0,
    progress: clampProgress(els.fProgress.value),
    status: els.fStatus.value,
  };
}

function fillForm(a) {
  state.editingId = a.id;
  els.fId.value = a.id;
  els.fTitle.value = a.title;
  els.fCourse.value = a.course;
  els.fDueDate.value = a.dueDate;
  els.fPlannedHours.value = a.plannedHours;
  els.fProgress.value = clampProgress(a.progress);
  els.fProgressVal.textContent = clampProgress(a.progress) + "%";
  els.fStatus.value = a.status;
  els.formTitle.textContent = "Edit assignment";
  els.submitBtn.textContent = "Save changes";
  els.cancelBtn.hidden = false;
  els.fTitle.focus();
}

function resetForm() {
  state.editingId = null;
  els.form.reset();
  els.fId.value = "";
  els.fProgressVal.textContent = "0%";
  els.formTitle.textContent = "Add an assignment";
  els.submitBtn.textContent = "Add assignment";
  els.cancelBtn.hidden = true;
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = readForm();
  const errors = validateAssignment(data);
  if (errors.length) {
    showToast(errors[0], "error");
    return;
  }
  setLoading(true);
  try {
    if (state.editingId) {
      await updateAssignment(state.editingId, { ...data, id: state.editingId });
      showToast("Assignment updated.");
    } else {
      await createAssignment(data);
      showToast("Assignment added.");
    }
    resetForm();
    await load();
  } catch (err) {
    showToast("Couldn't save. Is the server running?", "error");
    console.error(err);
  } finally {
    setLoading(false);
  }
});

els.cancelBtn.addEventListener("click", resetForm);

els.fProgress.addEventListener("input", () => {
  els.fProgressVal.textContent = clampProgress(els.fProgress.value) + "%";
});

// --- list interactions (PATCH / DELETE / edit) ---
els.list.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.tagName === "INPUT") return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  const item = state.assignments.find((a) => a.id === id);
  if (!item) return;

  if (action === "edit") {
    fillForm(item);
  } else if (action === "delete") {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteAssignment(id);
      showToast("Assignment deleted.");
      await load();
    } catch (err) {
      showToast("Delete failed.", "error");
      console.error(err);
    }
  } else if (action === "done") {
    try {
      await patchAssignment(id, { status: "done", progress: 100 });
      showToast("Nice — marked as done.");
      await load();
    } catch (err) {
      showToast("Update failed.", "error");
      console.error(err);
    }
  }
});

// Progress slider on a card -> PATCH just the progress (and keep status sensible).
els.list.addEventListener("change", async (e) => {
  const range = e.target.closest('input[data-action="progress"]');
  if (!range) return;
  const id = Number(range.dataset.id);
  const progress = clampProgress(range.value);
  const status = progress === 100 ? "done" : progress > 0 ? "in-progress" : "todo";
  try {
    await patchAssignment(id, { progress, status });
    await load();
  } catch (err) {
    showToast("Couldn't update progress.", "error");
    console.error(err);
  }
});

// --- filters ---
els.filterCourse.addEventListener("change", () => {
  state.filters.course = els.filterCourse.value;
  renderList();
});
els.filterStatus.addEventListener("change", () => {
  state.filters.status = els.filterStatus.value;
  renderList();
});

// --- go ---
load();
