// api.js — all communication with the JSON Server backend lives here.
// To deploy later, change this ONE line to your hosted API URL.
const isLocalDevelopment =
  typeof window === "undefined" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const BASE_URL = isLocalDevelopment ? "http://localhost:3000" : window.location.origin;
const ENDPOINT = `${BASE_URL}/assignments`;

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
  return request(ENDPOINT);
}

// POST — create a new assignment.
function createAssignment(data) {
  return request(ENDPOINT, { method: "POST", body: JSON.stringify(data) });
}

// PUT — replace an assignment with a full new version.
function updateAssignment(id, data) {
  return request(`${ENDPOINT}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// PATCH — update only the given fields (e.g. just progress, or just status).
function patchAssignment(id, partial) {
  return request(`${ENDPOINT}/${id}`, { method: "PATCH", body: JSON.stringify(partial) });
}

// DELETE — remove an assignment.
function deleteAssignment(id) {
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
