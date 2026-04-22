# CampusRide Optimization Log

Last updated: April 12, 2026

## Scope and guardrails

- Active mainline: `integration-local-localhost/`
- Preserved compatibility:
  - H5 route paths such as `/activities`, `/activities/:id`, `/login`
  - WeChat mini program handoff via `base_domain?tk=<code>`
  - `POST /api/v1/auth/wechat-login`
  - Activity check-in API path `POST /api/v1/activities/:activityId/checkin`
- Not force-cleaned:
  - `integration-production/`
  - `integration_backup_local_1.2.9/`
  - Reason: both are user-owned snapshots and should be archived intentionally, not deleted blindly

## Baseline matrix

| Area | Before | After | Notes |
| --- | --- | --- | --- |
| Repo entry clarity | 3/10 | 7/10 | Root README pointed to a non-existent `integration/` path; mainline now documented correctly |
| Frontend build health | 8/10 | 9/10 | Build passed before and after, but chunking is now materially improved |
| Frontend test health | 1/10 | 7/10 | No runnable frontend unit test setup before; Vitest is now installed and passing |
| Backend test health | 2/10 | 8/10 | Jest config was broken by an invalid `ts-jest` preset; backend unit tests now pass |
| Activity check-in integrity | 4/10 | 8/10 | Payload mismatch, duplicate route behavior, and missing auth on eligibility/history routes are fixed |
| Activity feed usefulness | 4/10 | 6/10 | Distance filter and `closest` sort now work; page still needs a cleaner activity-first UX split |
| CI accuracy | 1/10 | 8/10 | Workflow referenced dead directories; CI now targets the real frontend/backend mainline |
| Mini-program safety | 5/10 | 8/10 | Compatibility boundary was unclear before; current round explicitly preserved `tk` + WeChat login flow |

## Round 1

### Findings

1. Root docs and CI were still wired to an old `integration/` directory that no longer exists.
2. Backend tests could not run because Jest referenced `ts-jest/presets/default-esm`, but `ts-jest` was not installed and the project is JS, not TS.
3. The activity check-in chain had a real compatibility bug:
   - one frontend path sent `location`
   - another sent `userLocation`
   - the backend had duplicate `/activities/:id/checkin` behavior split across two implementations
4. Activity distance slider existed in UI but did not affect filtering, and `closest` sorting actually sorted by time.
5. The main web bundle was too eager because routes were statically imported.
6. WeChat mini program coupling exists through:
   - `mp-weixin/pages/index.js`
   - `profile.json`
   - `src/App.vue` storing `tk`
   - `src/views/LoginView.vue`
   - `POST /api/v1/auth/wechat-login`

### Changes made

#### Test infrastructure

- Fixed backend Jest ESM setup:
  - removed invalid `ts-jest` preset
  - switched backend scripts to `NODE_OPTIONS=--experimental-vm-modules jest`
  - simplified `tests/setup.js`
- Added backend unit coverage for:
  - activity check-in controller compatibility
  - auth middleware behavior
  - check-in time formatting
- Added frontend Vitest setup and passing unit tests for:
  - activity check-in payload normalization
  - activity feed filtering/sorting behavior

#### Activity check-in chain

- Normalized check-in payloads in [`src/utils/api.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/utils/api.js)
  - web payloads and mini-program style payloads now converge to one compatibility format
- Updated [`src/controllers/activity.controller.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/controllers/activity.controller.js)
  - accepts both `location` and `userLocation`
  - delegates to one check-in service path
  - returns both legacy-compatible and modal-friendly response fields
- Updated [`src/services/activity-checkin.service.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/services/activity-checkin.service.js)
  - supports optional check-in code validation
  - awards points on successful check-in
  - updates attendance status and points earned in participant data
- Updated [`src/routes/activity-checkin.routes.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/routes/activity-checkin.routes.js)
  - added missing `authenticateToken` middleware to eligibility/stats/history routes
  - removed the duplicate POST route that conflicted conceptually with the main activity router
- Fixed QR code modal response parsing in [`src/components/activities/CheckInQRCode.vue`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/components/activities/CheckInQRCode.vue)

#### Frontend performance and feature quality

- Switched router views in [`src/router/index.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/router/index.js) to lazy imports
- Added Vite manual chunk rules in [`vite.config.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/vite.config.js)
- Enabled real distance filtering and real `closest` sorting in [`src/composables/useActivityFeed.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/composables/useActivityFeed.js)
- Added viewer-distance enrichment inside [`src/views/ActivitiesView.vue`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/views/ActivitiesView.vue)

#### Repository hygiene

- Replaced the broken CI workflow at [`.github/workflows/ci-cd-test.yml`](/Users/zhuricardo/Desktop/GitHub/CampusRide/.github/workflows/ci-cd-test.yml)
- Corrected root README mainline path in [`README.md`](/Users/zhuricardo/Desktop/GitHub/CampusRide/README.md)
- Reduced backend auth debug log noise in tests via [`src/middleware/auth.middleware.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/middleware/auth.middleware.js)

### Verification results

Commands run successfully on April 12, 2026:

```bash
cd integration-local-localhost && npm test
cd integration-local-localhost && npm run build
cd integration-local-localhost/campusride-backend && npm test -- --runInBand
```

Observed outcomes:

- Frontend unit tests: `2` files, `4` tests passed
- Backend unit tests: `3` suites, `8` tests passed
- Frontend build: passed
- Entry bundle improvement:
  - before route splitting: main JS bundle was about `2.33 MB`
  - after route splitting and chunking: route entry chunk is about `71 KB`

### Residual risks after Round 1

1. `ant-design-vue` still produces a large shared `ui-kit` chunk. Startup is better, but library-level chunk weight is still high.
2. `/activities` is still a mixed page with groups + activity feed logic. It now behaves better, but the IA is still muddled.
3. Duplicate auth middleware directories still exist:
   - `src/middleware/`
   - `src/middlewares/`
   - This should be consolidated in a later round.
4. Current tests are unit-level only. There is still no browser E2E path covering login, activity join, or check-in.
5. No real environment integration was executed against live Supabase, live WeChat auth, or live email sending in this round.

## Round 2

### Screenshot-driven audit matrix

| Prompt feedback | Verdict | Reason | Action taken |
| --- | --- | --- | --- |
| Marketplace should be more prominent when users first enter | Real issue | `/home` redirected to `/activities`, and navigation also led with activities before marketplace | Changed `/home` default landing to `/marketplace` and moved Marketplace ahead of Activities in header navigation |
| `Available Rides` was easy to miss and should come before request flows | Real issue | Ride posting form rendered before the list and filter order put requests before seats-available discovery | Reordered the rideshare layout so browsing comes first, made `Seats Available` the default tab, and reordered the filter chips |
| Users need a direct chat path before booking / before buying | Partially real | Direct messaging already existed, but only through avatar popovers, so discoverability was poor enough to feel missing | Added explicit `Message Seller`, `Message Driver`, and `Message Rider` buttons in Marketplace and Rideshare flows |
| After booking, users need reminders and a clear place to find updates | Partially real | In-app ride lifecycle notifications already existed in `Messages -> My Rides`, but there were no external SMS/email/mini-program reminders | Surfaced the in-app reminder path in UI copy and documented the missing external channels and tool requirements below |
| After booking, users need a direct way to continue contacting each other | Real issue | Booking succeeded, but there was no guaranteed visible conversation thread from the booking flow itself | Auto-create a booking conversation thread when no existing direct thread exists, and expose `Open Chat` actions on booked rides |
| Marketplace image upload / posting showed `invalid or expired token` | Real issue | Upload and marketplace comment routes were still importing a stale legacy auth middleware that returned old 403 token errors | Repointed those routes to the current auth middleware and added a regression test for the legacy import path |

### Round 2 score matrix

| Area | Before | After | Notes |
| --- | --- | --- | --- |
| Default landing relevance | 4/10 | 8/10 | Login and mini-program handoff now land users on Marketplace instead of Activities |
| Marketplace posting reliability | 5/10 | 8/10 | Upload/auth path no longer uses the stale middleware that produced `invalid or expired token` during media posting |
| Marketplace housing / roommate fit | 3/10 | 7/10 | Housing and roommate use cases are now first-class categories with explicit posting guidance |
| Ride discovery clarity | 4/10 | 8/10 | `Available Rides` now appears before posting flows and defaults to seats-available browsing |
| Pre-book communication clarity | 3/10 | 8/10 | Messaging existed technically, but now it is visible and actionable from the relevant product surfaces |
| Post-book coordination | 4/10 | 7/10 | In-app conversation is now guaranteed; raw phone / WeChat exchange is still not a finished product flow |
| External reminder coverage | 2/10 | 3/10 | In-app reminders were clarified, but SMS / email / mini-program push still need external providers and scheduling |
| Mini-program safety | 8/10 | 8/10 | `tk` handoff and WeChat login flow were preserved; only the H5 post-login landing target changed |

### Changes made

#### Auth and upload chain

- Fixed stale legacy auth usage in:
  - [`src/routes/upload.routes.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/routes/upload.routes.js)
  - [`src/routes/marketplace-comments.routes.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/routes/marketplace-comments.routes.js)
- Replaced the obsolete compatibility copy at [`src/middlewares/auth.middleware.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/middlewares/auth.middleware.js)
  - it now re-exports the current middleware instead of returning old `403 INVALID_TOKEN` behavior
- Added backend regression coverage in [`tests/unit/auth-legacy-middleware.test.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/tests/unit/auth-legacy-middleware.test.js)

#### Marketplace discoverability and contact flow

- Changed [`src/router/index.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/router/index.js)
  - `/home` now redirects to `/marketplace`
- Reordered top navigation in [`src/components/layout/HeaderComponent.vue`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/components/layout/HeaderComponent.vue)
  - Marketplace now comes before Carpooling and Activities on desktop and mobile
- Expanded [`src/views/MarketplaceView.vue`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/views/MarketplaceView.vue)
  - added a top-level marketplace guidance panel
  - added `Housing` and `Roommates` categories
  - added explicit `Message Seller` CTAs in detail views
  - clarified that sublease / lease takeover / roommate search belong here
  - hardened file input reset behavior around image uploads

#### Rideshare IA and communication

- Updated [`src/views/RideshareView.vue`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/src/views/RideshareView.vue)
  - moved the ride list ahead of the posting form in the page hierarchy
  - made `Seats Available` the default tab
  - reordered filter chips so availability comes before requests
  - added explicit `Message Driver` / `Message Rider` / `Open Chat` buttons across ride cards, booked rides, and detail modals
  - added UI copy pointing users to `Messages -> My Rides` for booking updates
- Updated [`src/controllers/carpooling.controller.js`](/Users/zhuricardo/Desktop/GitHub/CampusRide/integration-local-localhost/campusride-backend/src/controllers/carpooling.controller.js)
  - auto-creates a direct booking conversation thread when a booking succeeds and no prior thread exists
  - includes booking context such as seat count, pickup location, contact number, and special requests in that initial message

### Verification results

Commands run successfully on April 12, 2026:

```bash
cd integration-local-localhost && npm test
cd integration-local-localhost && npm run build
cd integration-local-localhost/campusride-backend && npm test -- --runInBand
```

Observed outcomes:

- Frontend unit tests: `2` files, `4` tests passed
- Backend unit tests: `4` suites, `10` tests passed
- Frontend build: passed

### Residual risks after Round 2

1. External booking reminders are still not implemented:
   - current product behavior is in-app notifications plus ride prompts inside `Messages`
   - there is still no shipped SMS, transactional email, or mini-program subscription push for ride lifecycle events
2. Auto-created booking chat currently guarantees an in-app thread, but it does not yet create a dedicated structured booking summary card UI.
3. The product now treats housing and roommate posts as marketplace categories, but there is still no separate vertical-specific moderation or structured fields for lease terms, rent, move-in date, etc.
4. `ui-kit` remains the dominant frontend bundle. This round focused on UX correctness rather than further chunk reduction.
5. Browser-level E2E coverage is still missing for:
   - marketplace posting with images
   - message CTA flows
   - booking -> messages handoff
   - mini-program `tk` -> H5 -> post-login landing

## Next optimization rounds

### Round 2 candidate

- Split `/activities` into a cleaner activity-first hub and keep `/groups` purely social/map oriented
- Consolidate duplicate middleware/layout dead code
- Add smoke-level API contract tests for activity, marketplace, and auth routes
- Add Playwright or Cypress browser verification for:
  - login
  - activity join/cancel
  - activity check-in
  - mini-program `tk` handoff landing

### Round 3 candidate

- Reduce UI vendor chunk further by selective imports or component-level async loading
- Add observability and production diagnostics
- Add upload/media moderation and safety checks
- Add explicit mini-program compatibility regression checklist

## API keys and tools to prepare

### Already required by current code

| Need | Why it matters | Where it is used |
| --- | --- | --- |
| Supabase URL / anon key / service key | Core auth, data, messaging, activities | backend + database layer |
| JWT secret | Auth token issuance and verification | backend auth |
| Resend API key | Email verification and password reset | backend email service |
| Google Maps API key | Frontend map/radar/location features | frontend maps |
| WeChat Mini Program AppID + AppSecret | `tk` exchange login and short link generation | `auth.controller.js`, `wechat-link.service.js` |

### Strongly recommended next

| Tool / key | Why you should get it | Suggested future round |
| --- | --- | --- |
| Sentry DSN or equivalent | Capture frontend/backend runtime errors instead of relying on console logs | Round 2 |
| Product analytics key (PostHog / Amplitude) | Measure feature usage, drop-offs, and mini-program handoff success | Round 2 |
| Object storage / CDN credentials (S3 / Cloudinary / R2) | Media upload path should not rely on ad hoc local handling long-term | Round 2 |
| Content moderation API key | Marketplace and activity uploads need safety screening | Round 3 |
| Geocoding / Places API key | Better activity search, location quality, address normalization | Round 3 |
| Uptime / cron service credentials | Scheduled cleanup, health alerts, link expiry, operational jobs | Round 3 |

### Newly identified from Round 2

| Tool / key | Why you should get it | Suggested future round |
| --- | --- | --- |
| SMS provider key (Twilio / Vonage / AWS SNS) | Ride bookings currently have no production SMS reminder path for driver or passenger lifecycle events | Round 3 |
| Transactional lifecycle email provider key or expansion of existing Resend setup | `notification.service.js` only mocks email delivery for general notifications; booking / marketplace lifecycle emails are not production wired | Round 3 |
| WeChat mini-program subscription message template IDs and send capability | If you want booking reminders inside WeChat instead of only H5 in-app prompts, you need real subscribe-message setup beyond login handoff | Round 3 |
| Scheduler / queue credentials (QStash / Trigger.dev / cron worker) | External reminders and delayed ride follow-ups need background execution, not only client-side `showAfter` visibility logic | Round 3 |
| Marketplace moderation / anti-spam API key | Housing and roommate posts raise moderation risk and need richer screening than basic free-text posting | Round 3 |

### WeChat-specific note

If you want mini-program deep links and login to be production-stable, the critical pair is:

- `WECHAT_APPID`
- `WECHAT_APPSECRET`

Without those two, the current code will not complete:

- `POST /api/v1/auth/wechat-login`
- WeChat short-link generation for activity / ride / marketplace notices

## Current recommendation

The repo is in a materially healthier state than baseline, but the next highest-value work is no longer “fix what is broken”; it is “separate concerns and cover the critical user journeys with browser-level tests.”
