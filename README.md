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


## Updates

### Rate Limiting

All rate limiting is implemented using custom logic — no third party libraries. Each endpoint has a distinct strategy chosen to match the specific user behavior and risk profile of that endpoint. All limiters track by username as the primary identifier with a fallback to IP address if the username field is empty or absent.

---

#### Login — Token Bucket

Login uses a token bucket with a maximum capacity of 5 tokens. Each login attempt consumes one token. Tokens refill at a rate of 1 token per 30 second cooldown period — not a full refill, a gradual one. This keeps login flexible for legitimate users who fumble their password while making sustained brute force attacks impractical.

An additional measure was added during implementation — the bucket tracks both username and password fields. If either is present in the request it counts against the bucket. This prevents an attack pattern where the username is rotated across attempts to avoid being tracked while the password is held constant or vice versa.

---

#### Permanent Registration — Sliding Window

Registration uses a sliding window that checks requests within the last 5 hours. After 5 failed attempts within that window the user is blocked for the remainder of the 5 hour period.

The 5 hour window is intentional and tied directly to the verification code system. Verification codes expire after 2 hours — meaning by the time the sliding window reopens after a block, any code being targeted has long expired. The window is a security buffer on top of an already expiring credential, not just a standalone limit.

A secondary measure mirrors the login logic — the limiter counts up if either the verification code or the username is present in the request. This closes the gap where a brute force attempt could rotate usernames to avoid being tracked while targeting the same verification code.

The 5 attempt threshold also serves a practical purpose in a school environment. A legitimate user failing registration 5 times is a signal they need technical assistance — not more attempts.

---

#### Temporary Account Generation — Fixed Window

Onboarding uses a fixed window of 1 request per 10 seconds, tracked per username.

The strictness is intentional and serves two purposes. First, it acts as a security buffer against rapid duplicate code generation for the same student account — complementing the existing conflict resolution logic that already rejects older codes in favour of the most recent timestamp. Second, it gives a teacher who submits bad or empty data a forced 10 second pause to correct their input before trying again.

If the username field is empty or missing, the limiter falls back to the IP address and applies the same 10 second window. This means bad data does not escape rate limiting — it just shifts the tracking identifier. A valid username submitted within the same 10 second window still passes through, so a teacher correcting a different field is not penalised unnecessarily.

---

#### Planned Improvements

- Migrate all three custom rate limiting implementations to battle tested libraries once the current logic is fully validated
- Implement account lockout with admin verification as the resolution path for both security threats and user errors
- Review and harden all rate limiting configurations during the next backend week
