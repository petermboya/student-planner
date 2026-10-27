// api.js — all communication with the JSON Server backend lives here.
// To deploy later, change this ONE line to your hosted API URL.
const isLocalDevelopment =
  typeof window === "undefined" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const isGitHubPages =
  typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
const BASE_URL = isLocalDevelopment ? "http://localhost:3000" : window.location.origin;
const ENDPOINT = `${BASE_URL}/assignments`;
const DEMO_STORAGE_KEY = "student-planner.assignments";

async function readDemoAssignments() {
  const saved = localStorage.getItem(DEMO_STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const response = await fetch("db.json");
  if (!response.ok) throw new Error("Could not load demo assignments.");
  const data = await response.json();
  const assignments = data.assignments || data;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(assignments));
  return assignments;
}

async function writeDemoAssignments(assignments) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(assignments));
}

// Shared request helper so every call handles headers, errors and JSON the same way.
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status} ${res.statusText})`);
  }
  if (res.status === 204) return {}; // no content
  return res.json();
}

// GET — load every assignment.
function getAssignments() {
  if (isGitHubPages) return readDemoAssignments();
  return request(ENDPOINT);
}

// POST — create a new assignment.
function createAssignment(data) {
  if (isGitHubPages) {
    return readDemoAssignments().then((assignments) => {
      const id = Math.max(0, ...assignments.map((assignment) => Number(assignment.id) || 0)) + 1;
      const assignment = { ...data, id };
      return writeDemoAssignments([...assignments, assignment]).then(() => assignment);
    });
  }
  return request(ENDPOINT, { method: "POST", body: JSON.stringify(data) });
}

// PUT — replace an assignment with a full new version.
function updateAssignment(id, data) {
  if (isGitHubPages) {
    return readDemoAssignments().then((assignments) => {
      const updated = assignments.map((assignment) => assignment.id === id ? data : assignment);
      return writeDemoAssignments(updated).then(() => data);
    });
  }
  return request(`${ENDPOINT}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// PATCH — update only the given fields (e.g. just progress, or just status).
function patchAssignment(id, partial) {
  if (isGitHubPages) {
    return readDemoAssignments().then((assignments) => {
      let updatedAssignment;
      const updated = assignments.map((assignment) => {
        if (assignment.id !== id) return assignment;
        updatedAssignment = { ...assignment, ...partial };
        return updatedAssignment;
      });
      return writeDemoAssignments(updated).then(() => updatedAssignment);
    });
  }
  return request(`${ENDPOINT}/${id}`, { method: "PATCH", body: JSON.stringify(partial) });
}

// DELETE — remove an assignment.
function deleteAssignment(id) {
  if (isGitHubPages) {
    return readDemoAssignments().then((assignments) =>
      writeDemoAssignments(assignments.filter((assignment) => assignment.id !== id))
    );
  }
  return request(`${ENDPOINT}/${id}`, { method: "DELETE" });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BASE_URL,
    getAssignments,
    createAssignment,
    updateAssignment,
    patchAssignment,
    deleteAssignment,
  };
}
