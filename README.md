# school-website

A role-based authentication API built with Node.js, Express, MongoDB and TypeScript. This is the backend auth layer for Matinunura Secondary School's web platform — built as a gift to the school I attended.

---

## Why This Exists

The school needed a web platform with a student dashboard, teacher dashboard and an admissions system. The auth layer is the foundation everything else will sit on. I built this independently and will hand it over when the full system is complete.

---

## Tech Stack

- **Node.js + Express** — server and routing
- **MongoDB + Mongoose** — database, with local fallback if offline
- **TypeScript** — the whole thing is in TypeScript, not JavaScript. Converting it was brutal but TypeScript paid for itself as complexity scaled — fewer runtime conflicts, type errors caught early.

---

## System Design Decisions

### No email, names instead

This is a school environment. Teachers need to identify students by name when managing grades and records. Email-based identification would create unnecessary ambiguity. Names are the natural identifier here.

### Two phase student registration

Students cannot self-register openly. The flow works like this:

**Phase 1 — Teacher onboards the student**

- Teacher hits the onboard endpoint with the student's name
- System generates a 6-digit verification code with a timestamp
- Student record is written to a temporary collection
- Teacher gives the code to the student directly (in person)

**Phase 2 — Student completes registration**

- Student submits their name, verification code, age and chosen password
- System checks the temporary collection for a matching name and code
- If the code is expired (2 hour window) — rejected, teacher must regenerate
- If two codes exist for the same student — the most recent timestamp wins, the older one is rejected
- On successful match — student is pushed to the permanent database and the temp record is deleted

### Role is immutable from the student's side

Whatever role the teacher assigned in Phase 1 is what gets written to the permanent database. The student cannot override or influence their role during registration regardless of what they send in the request body. Only sensitive personal data (age, password) is taken from the student's input — nothing structural.

### Admin accounts are seeded directly

There is no public admin registration endpoint. Admin accounts are injected directly into the database via a seed script. This removes any attack surface from a registration flow entirely. Admin access is approved by the school principal. When someone with admin access leaves, their password is reset immediately.

### Admin cannot access dashboards

Admin accounts manage the system — user management, account control. They cannot log into student or teacher dashboards. The separation is intentional and enforced at the role middleware level.

---

## User Roles

| Role | Access |
|------|--------|
| Student | Own dashboard only |
| Teacher | Own dashboard only, can onboard students and other teachers |
| Admin | System management only, no dashboard access |

---

## API Endpoints

All routes are prefixed with `/auth`

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | None | Phase 2 student registration — completes onboarding using verification code |
| POST | `/auth/login` | None | Login for all roles, returns JWT |
| POST | `/auth/onboard-student` | Teacher | Phase 1 — pre-registers a student to the temporary collection |
| POST | `/auth/signout` | Any authenticated | Invalidates session |
| GET | `/auth/dashboard` | Any authenticated | Returns dashboard data based on role in token |

---

## Environment Variables

Create a `.env` file in the root. Reference `.env.example` for the required keys:

```
JWT_SECRET=
HMAC_SECRET=
MONGODB_URI=
PORT=
```

- `JWT_SECRET` — used to sign and verify tokens
- `HMAC_SECRET` — used for hashing sensitive data
- `MONGODB_URI` — your MongoDB connection string (local or Atlas)
- `PORT` — port the server runs on

---

## Setup

```bash
# Clone the repo
git clone https://github.com/your-username/school-website.git
cd school-website

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values

# Seed admin accounts
npx ts-node seed.ts

# Run in development
npm run dev
```

---

## Known Limitations and Planned Improvements

- Verification codes are delivered out of band (physically). They are not encrypted in transit — this is acceptable for v1 given the school environment but will be addressed.
- Teachers can currently onboard other teachers. Admin control over teacher account creation is planned for a future version.
- Data encryption in transit needs to be implemented before production handover.
- This is v1. The architecture is intentionally kept simple to remain maintainable by whoever takes it over.

---

## Lessons Learned

Every new file took 15-20 minutes to type-safe and stabilise. What felt like brutal debugging at the time turned out to be ESLint enforcing best practices — most of the errors weren't breaking anything, the linter was just holding the code to a higher standard.

The two phase registration system was not planned upfront. It emerged during the build when I realised an open registration flow made no sense for a school environment. Most of the meaningful design decisions happened during implementation, not before it.

TypeScript slowed the build down at the start and made things significantly easier as complexity scaled. That tradeoff is worth it.
