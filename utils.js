// utils.js — pure helper functions for the Student Planner.
// These are framework-free and side-effect-free, which makes them easy to unit test.

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DUE_SOON_DAYS = 3;
const STATUSES = ["todo", "in-progress", "done"];

// Whole days from `today` until `dueDate` (negative = overdue).
function daysUntil(dueDate, today = new Date()) {
  const due = new Date(dueDate);
  const t = new Date(today);
  // Normalise both to midnight so partial days don't skew the count.
  due.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.round((due - t) / MS_PER_DAY);
}

// "overdue" | "due-soon" | "upcoming", based purely on the due date.
function deadlineStatus(dueDate, today = new Date()) {
  const days = daysUntil(dueDate, today);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

// Keep a progress value inside 0–100 (rounds, and treats junk as 0).
function clampProgress(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Returns an array of human-readable validation errors ([] means valid).
function validateAssignment(data = {}) {
  const errors = [];
  if (!data.title || !String(data.title).trim()) errors.push("Title is required.");
  if (!data.course || !String(data.course).trim()) errors.push("Course is required.");
  if (!data.dueDate) {
    errors.push("Due date is required.");
  } else if (Number.isNaN(new Date(data.dueDate).getTime())) {
    errors.push("Due date is not a valid date.");
  }
  if (data.plannedHours != null && data.plannedHours !== "") {
    const h = Number(data.plannedHours);
    if (Number.isNaN(h) || h < 0) errors.push("Planned hours must be 0 or more.");
  }
  if (data.progress != null && data.progress !== "") {
    const p = Number(data.progress);
    if (Number.isNaN(p) || p < 0 || p > 100) errors.push("Progress must be between 0 and 100.");
  }
  return errors;
}

// New array sorted by nearest due date first (does not mutate the input).
function sortByDueDate(list = []) {
  return [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// Filter by course and/or status. "all" (or missing) means "don't filter on this".
function filterAssignments(list = [], { course = "all", status = "all" } = {}) {
  return list.filter((a) => {
    const courseOk = course === "all" || a.course === course;
    const statusOk = status === "all" || a.status === status;
    return courseOk && statusOk;
  });
}

// Dashboard summary numbers.
function computeStats(list = [], today = new Date()) {
  const total = list.length;
  const done = list.filter((a) => a.status === "done").length;
  const overdue = list.filter(
    (a) => a.status !== "done" && deadlineStatus(a.dueDate, today) === "overdue"
  ).length;
  const dueSoon = list.filter(
    (a) => a.status !== "done" && deadlineStatus(a.dueDate, today) === "due-soon"
  ).length;
  const avgProgress =
    total === 0
      ? 0
      : Math.round(list.reduce((sum, a) => sum + clampProgress(a.progress), 0) / total);
  return { total, done, overdue, dueSoon, avgProgress };
}

// Planned study hours grouped by course, e.g. { "Maths": 7, "History": 3 }.
function studyHoursByCourse(list = []) {
  return list.reduce((acc, a) => {
    const hrs = Number(a.plannedHours) || 0;
    acc[a.course] = (acc[a.course] || 0) + hrs;
    return acc;
  }, {});
}

// Total planned study hours across all assignments.
function totalPlannedHours(list = []) {
  return list.reduce((sum, a) => sum + (Number(a.plannedHours) || 0), 0);
}

// "2026-11-02" -> "2 Nov 2026" (empty string for invalid input).
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Pretty label for a status key.
function statusLabel(status) {
  const map = { "todo": "To do", "in-progress": "In progress", "done": "Done" };
  return map[status] || status;
}

// Export for Jest / Node. Harmless in the browser, where `module` is undefined
// and these functions simply live on the global scope instead.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    daysUntil,
    deadlineStatus,
    clampProgress,
    validateAssignment,
    sortByDueDate,
    filterAssignments,
    computeStats,
    studyHoursByCourse,
    totalPlannedHours,
    formatDate,
    statusLabel,
    STATUSES,
  };
}
