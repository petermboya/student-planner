# Student Planner

A simple, clean web app that helps students **organise assignments, track deadlines, plan study time, and monitor their progress**. Built with JavaScript on the frontend and [JSON Server](https://github.com/typicode/json-server) as a mock REST API backend.

## Objectives 
- **Organise assignments** — Allows students to add, edit, and delete assignments; filter by course and status.
- **Track deadlines** — Students can be able to see the status of their  assignments by colour-coded badges (Overdue / Due soon / Upcoming), sorted by nearest due date.
- **Plan study time** — Students can set planned study hours per assignment and see totals per course.
- **Monitor progress** — A student can oversee their progress with the per-assignment progress bars plus a dashboard overview (totals, completed, due soon/overdue, average progress).

## Tech stack
- HTML5 (semantic structure) + CSS3 (responsive, three-colour palette)
- Vanilla JavaScript, split into modules
- JSON Server (mock REST API, data persisted in `db.json`)
- Jest (unit tests + coverage)


## Setup & running
Requires [Node.js](https://nodejs.org) (v16+).
git clone https://github.com/petermboya/student-planner.git
cd student-planner
npm install
npm run server

Keep the API running on port 3000, then open `index.html` with a local static file server 

## API endpoints
The backend exposes a REST resource at `http://localhost:3000/assignments`:

| Method | Endpoint           | Purpose                              |
| ------ | ------------------ | ------------------------------------ |
| GET    | `/assignments`     | List all assignments                 |
| POST   | `/assignments`     | Create a new assignment              |
| PUT    | `/assignments/:id` | Replace an assignment (full update)  |
| PATCH  | `/assignments/:id` | Update fields (e.g. progress/status) |
| DELETE | `/assignments/:id` | Delete an assignment                 |

## Live links
- Repository: [github.com/petermboya/student-planner](https://github.com/petermboya/student-planner)
- Live demo: [petermboya.github.io/student-planner](https://petermboya.github.io/student-planner/)


## License
MIT — see [LICENSE](LICENSE).
