# Email Verification + Password Reset Test Plan (Production Code)

Scope: `integration-production` frontend + `integration-production/campusride-backend` auth endpoints.

## Goals

- Remove the incorrect `@university.edu` suffix requirement in:
  - Forgot password
  - Resend verification email
- Validate the resend-verification flow is correct, safe (no user enumeration), and user-friendly.

## Preconditions / Setup

- Backend running (default): `http://localhost:3001`
- Frontend running (default): `http://localhost:5173`
- `FRONTEND_URL` in backend env points to the correct frontend base URL used in email links.
- Email provider configured (Resend API key) if you want to verify real email delivery.
- Test users in DB:
  - **User A (unverified)**: `unverified_user@cornell.edu` with `is_verified=false`
  - **User B (verified)**: `verified_user@cornell.edu` with `is_verified=true`
  - **User C (nonexistent)**: `does_not_exist_12345@cornell.edu` (not present in DB)

## Frontend UI Test Cases

### 1) Forgot Password UI (no forced suffix)

Page: `/forgot-password`

- Input accepts any email format (no client-side `@university.edu` blocking).
- Submit sends request and shows success/error.

Cases:
1. Empty email
   - Expected: inline error "Email address is required"; request not sent.
2. `does_not_exist_12345@cornell.edu`
   - Expected: success message shown (generic; should not reveal account existence).
3. `unverified_user@cornell.edu`
   - Expected: error message from backend like "Email not verified..." and UI offers link to resend verification.
4. `verified_user@cornell.edu`
   - Expected: success message "Password reset email sent..."; email received (if email provider configured).

### 2) Resend Verification UI (no forced suffix)

Page: `/resend-verification`

Cases:
1. Empty email
   - Expected: inline error "Email address is required"; request not sent.
2. `does_not_exist_12345@cornell.edu`
   - Expected: success message (generic; should not reveal account existence).
3. `unverified_user@cornell.edu`
   - Expected: success message; email received with verify link (if provider configured).
4. `verified_user@cornell.edu`
   - Expected: success message from backend (may be "Email address is already verified"); user can return to login.

### 3) Verify Email Page Behavior

Page: `/verify-email/:token`

Cases:
1. Valid token for **User A**
   - Expected: "Email Verified!" and login CTA.
2. Token already used / user already verified
   - Expected: "Already Verified".
3. Expired token
   - Expected: "Verification Failed" + resend UI.
4. Invalid token
   - Expected: "Verification Failed" + resend UI.

Resend-in-error-state:
- Enter email and click Resend.
- Expected: success alert uses backend message; no forced suffix.

## API-Level Tests (curl)

These validate backend behavior independent of UI.

### Resend verification

```bash
curl -sS -X POST http://localhost:3001/api/v1/auth/resend-verification \
  -H 'Content-Type: application/json' \
  -d '{"email":"does_not_exist_12345@cornell.edu"}'
```

- Expected: `{"success":true,...}` with a generic message (do not leak existence).

```bash
curl -sS -X POST http://localhost:3001/api/v1/auth/resend-verification \
  -H 'Content-Type: application/json' \
  -d '{"email":"unverified_user@cornell.edu"}'
```

- Expected: `{"success":true,...}` and email delivery attempted.

### Forgot password

```bash
curl -sS -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"does_not_exist_12345@cornell.edu"}'
```

- Expected: `{"success":true,...}` with a generic message (do not leak existence).

```bash
curl -sS -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"unverified_user@cornell.edu"}'
```

- Expected: `{"success":false,"error":{...}}` with `EMAIL_NOT_VERIFIED` (or equivalent).

## What “Good” Looks Like (Checklist)

- No hard-coded `@university.edu` suffix gating in forgot-password/resend-verification UI.
- Resend verification:
  - Does not reveal whether an email exists (for unknown users).
  - For unverified users: generates a new token and sends a fresh link.
  - For already-verified users: returns success with a helpful message.
- Verify-email page correctly handles:
  - valid / expired / invalid / already-verified tokens
  - provides a resend option on failure.

