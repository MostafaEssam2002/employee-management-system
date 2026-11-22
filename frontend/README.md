# BrainWise Employee Management System

BrainWise is a React single-page application for viewing and managing companies,
departments, employees, and user accounts. It includes login and registration
screens, role-gated dashboard routes, searchable paginated tables, detail views,
and create/update/delete workflows.

This repository contains the **frontend only**. It expects a separate HTTP API
to be available at `http://localhost:3000`; no backend implementation, database,
or API specification is included here.

## Contents

- [Features and implementation](#features-and-implementation)
- [Technology](#technology)
- [Prerequisites](#prerequisites)
- [Install and run](#install-and-run)
- [Configuration and backend integration](#configuration-and-backend-integration)
- [Application routes and access control](#application-routes-and-access-control)
- [API reference](#api-reference)
- [Security and data protection](#security-and-data-protection)
- [Validation and completion checklist](#validation-and-completion-checklist)
- [Assumptions and limitations](#assumptions-and-limitations)

## Features and implementation

- **Authentication screens:** login and employee registration forms submit JSON
  to the backend authentication endpoints.
- **Dashboard:** companies, departments, employees, and users are presented
  through data tables, detail screens, search, pagination, and create/update
  flows. Delete actions update the table after the API confirms success.
- **Role-gated navigation:** route access is checked against the locally stored
  user's `role` value.
- **Shared request helpers:** the `src/utilis` helpers handle GET, POST, PATCH,
  and DELETE requests, include cookies, parse JSON responses, and surface
  backend errors to the form or page.
- **Paginated data loading:** table and detail pages request the current page;
  company selection loads the associated departments for employee forms.
- **Responsive interface:** React components and CSS/SCSS styles provide the
  application layout and forms.

### Project structure

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Browser router and application route declarations |
| `src/ProtectedRoute.jsx` | Local role checks and redirects |
| `src/pages/` | Login, registration, list, detail, create, and update pages |
| `src/components/` | Shared forms, inputs, tables, layout, sidebar, and UI controls |
| `src/hooks/` | Data loading for tables, companies, and company departments |
| `src/utilis/` | Fetch, submit, update, and delete request helpers |
| `src/assets/` | Logos, illustrations, and icons |
| `vite.config.js` | Vite development and build configuration |

## Technology

- React 19
- React Router 7
- Vite 8
- JavaScript ES modules
- CSS and SCSS

## Prerequisites

- Node.js **20.19+** or **22.12+** (required by the installed Vite 8 release)
- npm (the repository includes `package-lock.json`)
- The BrainWise backend API running at `http://localhost:3000`

The backend must accept credentialed browser requests from the frontend origin.
For local development, this will normally be `http://localhost:5173`.

## Install and run

From the project directory:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). Start
the backend separately before using features that load or submit API data.

Available scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally for a production preview |
| `npm run lint` | Run ESLint against the project |

There is currently no test script configured in `package.json`.

## Configuration and backend integration

The API base URL is currently hard-coded as `http://localhost:3000` in the
pages and hooks. This repository does not currently read an API URL from an
environment variable and does not configure a Vite proxy. To use a different
backend or deploy the frontend, update those URL references consistently and
configure the backend's CORS and cookie settings for the deployed frontend
origin.

The browser sends `credentials: "include"` for API requests. The backend must
therefore allow credentials and explicitly allow the frontend origin; wildcard
`Access-Control-Allow-Origin: *` is not compatible with credentialed requests.
For local development, use a backend host/port and cookie policy that work
with the frontend's origin.

## Application routes and access control

| Route | Access |
| --- | --- |
| `/login` | Public |
| `/register` | Public |
| `/landingpage` | Declared as a public landing page and within a protected route group |
| `/unauthorized` | Public |
| `/departments` | Admin, Manager, or Employee |
| `/companies`, `/company/:id`, `/department/:id`, `/employee/:id` | Admin |
| `/employees`, `/users` | Admin |
| `/add-company`, `/add-department`, `/add-employee`, `/add-user` | Admin |
| `/update/company/:id`, `/update/department/:id`, `/update/employee/:id` | Admin |

`ProtectedRoute` reads a JSON user object from `localStorage` under the key
`user`. A missing or unreadable value redirects to `/login`; a role not in the
route's allowed-role list redirects to `/unauthorized`.

## API reference

All API paths below are relative to `http://localhost:3000`. Endpoint behavior
and response fields are documented from frontend usage; the backend source and
an authoritative API specification are not part of this repository.

### Authentication

| Method | Path | Frontend behavior |
| --- | --- | --- |
| `POST` | `/auth/login` | Sends login form fields (`email`, `password`). On success, the frontend stores `response.data` as the local user and navigates to `/departments`. |
| `POST` | `/auth/register` | Sends registration form fields: `name`, `email`, `password`, `mobile`, `designation`, `departmentId`, `address`, `hiredOn`, and `role` (the form supplies `Employee`). |

### Companies

| Method | Path | Parameters / behavior |
| --- | --- | --- |
| `GET` | `/company?page={page}` | Paginated company list. The frontend reads `data` and `pagination.totalPages`. |
| `POST` | `/company` | Creates a company from form JSON (`name`). |
| `GET` | `/company/{id}` | Reads a company; the frontend reads `data`, including associated departments where available. |
| `PATCH` | `/company/{id}` | Updates a company. The form submits JSON; empty fields are omitted. |
| `DELETE` | `/company/{id}` | Deletes a company. |

### Departments

| Method | Path | Parameters / behavior |
| --- | --- | --- |
| `GET` | `/department?page={page}` | Paginated department list. The frontend reads `data` and `pagination.totalPages`. |
| `POST` | `/department` | Creates a department from form JSON (`name`, `companyId`). |
| `GET` | `/department/{id}?page={page}` | Reads department details and a page of employees; the frontend reads `data` and optional `pagination`. |
| `PATCH` | `/department/{id}` | Updates a department. The form submits JSON; empty fields are omitted. |
| `DELETE` | `/department/{id}` | Deletes a department. |

### Employees

| Method | Path | Parameters / behavior |
| --- | --- | --- |
| `GET` | `/employee?page={page}` | Paginated employee list. The frontend reads `data` and `pagination.totalPages`. |
| `POST` | `/employee` | Creates an employee. The form includes `name`, `email`, `mobile`, `address`, `designation`, `companyId`, and `departmentId`. |
| `GET` | `/employee/{id}` | Reads an employee; the frontend reads `data`. |
| `PATCH` | `/employee/{id}` | Updates an employee. The form submits JSON; empty fields are omitted. |
| `DELETE` | `/employee/{id}` | Deletes an employee. |

### Users

| Method | Path | Parameters / behavior |
| --- | --- | --- |
| `GET` | `/user?page={page}` | Paginated user list. The frontend reads `data` and `pagination.totalPages`. |
| `POST` | `/user` | Creates a user. The form includes `name`, `email`, `password`, and `role`. |
| `GET` | `/user/{id}` | Reads a user for the update form; the frontend reads `data`. |
| `PATCH` | `/user/{id}` | Updates a user. The form submits JSON; empty fields are omitted. |

`{id}` is the entity identifier. `page` is the requested page number and starts
at `1`. Create and update requests send JSON with a `Content-Type: application/json`
header. The shared request helpers expect successful API
responses to be JSON. Collection responses are expected to contain
`{ "data": [...], "pagination": { "totalPages": number } }`; detail responses
are generally expected to contain `{ "data": ... }`. Error responses should
provide a readable `message` field where possible; otherwise the frontend
shows a generic request error. Exact status codes and complete schemas are
defined by the external backend, not by this frontend.

No external API documentation URL is configured in this repository. For full
request schemas, authentication behavior, and server-side response codes,
consult the backend's API documentation.

## Security and data protection

- The frontend makes credentialed requests and is designed to work with
  backend-managed cookies. It does not attach a bearer token in request
  headers.
- The frontend stores the user object returned from login in `localStorage`
  and uses its `role` value to decide which routes to render.
- Route-level role checks improve navigation and user experience, but they are
  **not a security boundary**. A user can modify browser storage or call the API
  directly. The backend must authenticate every protected request and enforce
  authorization for every resource and operation.
- The registration form submits a hidden `role` value of `Employee`. Hidden
  client fields can be changed and must not be trusted by the server.
- Use HTTPS in production; configure secure, appropriately scoped,
  `HttpOnly`/`SameSite` session cookies on the backend, and validate
  authorization, input, and CSRF protections server-side as appropriate.
- The frontend does not contain a documented password policy, token refresh
  flow, or logout/session invalidation workflow. Do not treat route guards as a
  substitute for those backend controls.

## Validation and completion checklist

- [x] Documented the frontend architecture and implementation approach.
- [x] Added installation, prerequisites, development, build, preview, and lint
  instructions.
- [x] Documented application routes and their configured role lists.
- [x] Listed API endpoints and the parameters and response shapes used by the
  frontend.
- [x] Documented security behavior, boundaries, and backend responsibilities.
- [x] Recorded assumptions and known integration limitations.
- [ ] Backend/API deployment configuration: requires the external backend and
  its environment-specific URL, CORS, and cookie settings.
- [ ] OpenAPI/API documentation link: not available in this frontend repository.

## Assumptions and limitations

- The API is expected to be available at `http://localhost:3000`, as specified
  in the current frontend source.
- The backend returns JSON data in the shapes described above and supplies a
  `data` property for authentication and detail responses.
- The API supports the operations/methods listed above. Update requests use
  `PATCH` in the request helper even though the form's HTML `method` attribute
  is set to `put`.
- Frontend route protection is convenience-only; access-control guarantees
  depend on the backend.
- No backend source, database, seed data, deployment instructions, or API
  specification is provided in this project.
