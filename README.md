# Expense Voucher Management System

A web-based system that digitizes expense voucher creation, approval and tracking.

- **Employees** create vouchers, sign them and submit them for approval.
- **The Director** reviews submitted vouchers and approves or rejects them.
- **The Accounts Team** views all submitted vouchers for reimbursement processing.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express.js |
| Database | PostgreSQL (plain SQL via the `pg` library, no ORM) |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` password hashing |
| File upload | `multer` (images stored on disk, path stored in DB) |
| Frontend | React (Vite), React Router, Tailwind CSS, axios |
| Icons | Font Awesome |

## Project structure

```
expense-voucher-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js             # authenticate + requireRole
│   │   │   └── upload.js           # multer config (type + size checks)
│   │   ├── controllers/            # authController, voucherController,
│   │   │                           # userController, dashboardController
│   │   ├── routes/                 # authRoutes, voucherRoutes,
│   │   │                           # userRoutes, dashboardRoutes
│   │   ├── seed.js                 # creates one test user per role
│   │   ├── seedData.js             # fills the database with demo data
│   │   └── server.js               # app entry point
│   ├── uploads/                    # signature images
│   ├── schema.sql                  # database schema
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js            # axios instance (adds the JWT to requests)
│   │   ├── context/AuthContext.jsx # logged-in user, login, logout
│   │   ├── components/             # Layout, ProtectedRoute, StatusBadge,
│   │   │                           # StatCard, RecentList, Modal
│   │   ├── hooks/useFetch.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── VoucherDetails.jsx  # shared by all three roles
│   │   │   ├── VoucherList.jsx     # search / filter / sort (Director, Accounts)
│   │   │   ├── employee/           # EmployeeDashboard, MyVouchers, VoucherForm
│   │   │   ├── director/           # DirectorDashboard
│   │   │   └── accounts/           # AccountsDashboard
│   │   ├── utils/                  # roles.js, format.js
│   │   └── App.jsx                 # routes
│   ├── .env.example
│   └── package.json
└── README.md
```

## Setup

**Prerequisites:** Node.js 18+ and PostgreSQL.

### Backend

```bash
# 1. Create the database
createdb voucher_db

# 2. Install dependencies
cd backend
npm install

# 3. Create the tables
psql voucher_db -f schema.sql

# 4. Configure environment
cp .env.example .env        # on Windows: copy .env.example .env
# then edit .env with your database password and a long random JWT secret

# 5. Create the test users (one per role)
node src/seed.js

# 6. Optional: fill the database with demo data
node src/seedData.js --reset

# 7. Start the server
npm run dev
```

Check it is running: open `http://localhost:5000/api/health`. A timestamp means Node and PostgreSQL are connected.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # on Windows: copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

`backend/.env.example`

```
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/voucher_db
JWT_SECRET=replace_with_a_long_random_string
```

`frontend/.env.example`

```
VITE_API_URL=http://localhost:5000
```

### Test users

All use the password `password123`.

| Role | Email |
|---|---|
| Employee | employee@test.com |
| Director | director@test.com |
| Accounts | accounts@test.com |

`seedData.js` also adds five more employees: `ravi@test.com`, `priya@test.com`, `arjun@test.com`, `sneha@test.com` and `rohan@test.com`.

### Demo data

`node src/seedData.js` adds 6 employees and 66 vouchers covering every status (draft, pending, approved, rejected), spread over roughly the last 70 days, with generated signature images and a saved signature for the Director. It uses fixed random numbers, so every run produces the same data.

- `node src/seedData.js` adds the data on top of what exists.
- `node src/seedData.js --reset` deletes **all vouchers** first and restarts voucher numbering at `0001`. Users are never deleted.

Run `node src/seed.js` first, because `seedData.js` expects the Director user to exist.

## Screens by role

| Role | Screens |
|---|---|
| Employee | Dashboard, My Vouchers (with status tabs), New Voucher, Edit Draft, Voucher Details |
| Director | Dashboard, Pending Approvals, All Vouchers (search, filter, sort), Voucher Details with Approve and Reject |
| Accounts | Dashboard, All Vouchers (search, filter, sort), Voucher Details with both signatures |

Routes are protected by role. A logged-in user who opens another role's URL is sent back to their own home page, and a logged-out user is sent to the login page.

## Database schema

Defined in `backend/schema.sql`.

### `users`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) | unique |
| password_hash | TEXT | bcrypt hash, never returned by the API |
| role | VARCHAR(20) | `EMPLOYEE`, `DIRECTOR` or `ACCOUNTS` (CHECK constraint) |
| employee_code | VARCHAR(30) | optional employee ID |
| signature_path | TEXT | Director's saved signature, reused when approving |
| created_at | TIMESTAMP | |

### `vouchers`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| voucher_number | VARCHAR(30) | unique, auto-generated, e.g. `VCH-2026-0001` |
| voucher_date | DATE | defaults to today |
| expense_date, department, title, category, description, amount | various | nullable so drafts can be incomplete; mandatory fields are validated at submit time |
| status | VARCHAR(20) | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED` (CHECK constraint), defaults to `DRAFT` |
| employee_id | INT FK to users | the voucher's owner |
| employee_signature_path | TEXT | |
| director_id | INT FK to users | who approved or rejected |
| director_signature_path | TEXT | copied onto the voucher at approval |
| approved_at | TIMESTAMP | set on approval only |
| rejection_reason | TEXT | set on rejection |
| created_at, updated_at | TIMESTAMP | audit fields |

Voucher numbers come from a PostgreSQL sequence (`voucher_number_seq`), so two simultaneous requests can never receive the same number.

## Workflow

```
DRAFT ──submit──▶ PENDING_APPROVAL ──approve──▶ APPROVED
  ▲ (edit/delete       │
  │  only here)        └──reject───▶ REJECTED
```

## API documentation

Base URL: `http://localhost:5000/api`

Every endpoint except login and health requires the header:

```
Authorization: Bearer <token>
```

Error responses use the shape `{ "error": "message" }`. `401` means missing or invalid token, `403` means the role is not allowed, `404` means not found (or not visible to this user), `400` means validation failed.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Body: `{ email, password }`. Returns `{ token, user }`. Token expires in 8 hours. |
| GET | `/health` | Public | Server and database check. |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/users/me/signature` | Director | Multipart form, field `signature` (PNG/JPG, max 2 MB). Saves a reusable signature. |

### Vouchers

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/vouchers` | Employee | Create a draft. Body: `expense_date, department, title, category, description, amount`. |
| GET | `/vouchers/me` | Employee | List the employee's own vouchers, newest first. |
| GET | `/vouchers/:id` | Employee, Director, Accounts | Voucher details, including `employee_name`, `employee_code` and `director_name`. Employees see only their own; Director and Accounts see everything except drafts. |
| PUT | `/vouchers/:id` | Employee | Edit a draft (full replace of the 6 editable fields). |
| DELETE | `/vouchers/:id` | Employee | Delete a draft. |
| POST | `/vouchers/:id/signature` | Employee | Multipart form, field `signature`. Attaches the employee signature to a draft. |
| POST | `/vouchers/:id/submit` | Employee | Validates mandatory fields and signature, then DRAFT to PENDING_APPROVAL. Returns `400` with a `details` list if incomplete. |
| GET | `/vouchers` | Director, Accounts | List all non-draft vouchers (see query parameters below). |
| POST | `/vouchers/:id/approve` | Director | Optional multipart `signature`; otherwise uses the saved signature. `400` if neither exists. |
| POST | `/vouchers/:id/reject` | Director | Body: `{ rejection_reason }` (required). |

Voucher ids in the path must be whole numbers; anything else returns `404`.

#### List query parameters (`GET /vouchers`)

| Parameter | Meaning |
|---|---|
| `search` | Matches voucher number or employee name (case-insensitive, partial) |
| `status` | `PENDING_APPROVAL`, `APPROVED` or `REJECTED` |
| `department`, `category` | Partial, case-insensitive match |
| `from`, `to` | Expense date range, `YYYY-MM-DD` |
| `min_amount`, `max_amount` | Amount range |
| `sort` | `created_at` (default), `amount`, `expense_date`, `status` |
| `order` | `desc` (default) or `asc` |

Example: `/vouchers?status=APPROVED&min_amount=500&sort=amount&order=asc`

The Director's "Pending Approvals" screen is `/vouchers?status=PENDING_APPROVAL`.

### Dashboards

| Method | Endpoint | Access | Response |
|---|---|---|---|
| GET | `/dashboard/employee` | Employee | `{ total, draft, pending, approved, rejected, total_claimed }` |
| GET | `/dashboard/director` | Director | `{ pending_count, approved_today, rejected_today, total_pending_amount, recent[] }` |
| GET | `/dashboard/accounts` | Accounts | `{ total, pending, approved, rejected, total_approved_amount, recent[] }` |

## Security notes

- Passwords are stored as bcrypt hashes and never returned by the API.
- Role checks and ownership checks happen on the server, in the SQL query itself (for example `WHERE id = $1 AND employee_id = $2`), not only in the UI.
- The voucher owner always comes from the JWT (`req.user.id`), never from the request body.
- Update endpoints whitelist editable fields, so a client cannot set `status` directly.
- All queries are parameterized (no string-built SQL with user input). Sort columns are chosen from a fixed whitelist.
- Uploads are restricted to PNG/JPG, max 2 MB, and saved under random filenames.
- The frontend removes the stored token and returns to the login page when the API answers `401`.

## Assumptions

1. "Submitted" and "Pending Approval" are the same moment, so they are stored as one status: `PENDING_APPROVAL`.
2. Drafts are private to the employee. The Director and Accounts see only submitted, approved and rejected vouchers.
3. Employee dashboard "Total Amount Claimed" counts all non-draft vouchers.
4. There is no `rejected_at` column. "Rejected Today" uses `updated_at`, which is accurate because rejected vouchers are read-only afterwards.
5. "Today" in the Director dashboard is the database server's current date.
6. The Director may save a signature once and reuse it, or upload a fresh one with an approval. The path is copied onto the voucher at approval, so old vouchers keep their original signature if the Director later saves a new one.
7. Signature files are served publicly from `/uploads`, but with unguessable random filenames.
8. Uploaded files are not deleted when a voucher is deleted (kept for simplicity).
9. User accounts are seeded, since the spec has no registration flow.
10. Editing a draft is a full replace: the request must send all six editable fields every time.
11. Amounts are displayed in Indian rupees (₹), since the spec does not name a currency.
12. List filters are applied when the user clicks Apply, not on every keystroke, so each search is one request.
13. Lists return all matching vouchers without pagination.
14. `DATE` columns are returned as plain `YYYY-MM-DD` strings, to avoid timezone shifts.