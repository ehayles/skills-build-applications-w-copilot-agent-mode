# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep routed Bootstrap views and use the shared API client with accessible loading, empty, success, and error states.
- Logic tier decision: Keep routes thin and implement validation and business behavior in explicit Express service functions; retain deliberate 4xx responses and no authentication.
- Data tier decision: Require meaningful Mongoose fields and references; preserve stable, non-destructive seed upserts and membership reconciliation.
- Activity tracking approach: Validate input and existing user/team IDs before writing; award one point per minute and set the occurrence time on the server.
- Team management approach: Validate name, mascot, and existing member IDs, and preserve submitted team fields and members.
- Leaderboard approach: Sum persisted activity points per team, sort descending with deterministic ties, and assign 1-based ranks.
- Workout suggestions approach: Resolve the email to a user, inspect their latest activities, rank matching workout focuses ahead of other workouts, and explain each recommendation; return 404 for unknown users.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`

### Verification results

- `npm test --prefix octofit-tracker/backend`: 12 tests passed, including required schema fields, non-destructive seed idempotency, API behavior, invalid inputs, and deterministic leaderboard ties. The original failures were missing schema validation and placeholder service behavior.
- `npm test --prefix octofit-tracker/frontend`: 19 tests passed, including API-backed content, accessible request states, activity/team submission, submission errors, and changing the workout email. The original failures were placeholder views without API requests.
- Both build commands above passed with no TypeScript errors.
- `node .github/scripts/grade-step.mjs step5-final`: passed composition checks, protected contract verification, all contract suites, and both builds.
- The separate maintainer exercise-validation suite previously reported four failures caused by the README template-badge owner/name mismatch. That unrelated metadata issue is unchanged.

### Final integration verification (2026-11-11)

- Reran the five commands in the test plan: data contracts passed (5 tests), API contracts passed (4 tests), frontend tests passed (19 tests), and both production builds passed.
- Confirmed MongoDB on 27017, Express on 8000, and Vite on 5173. Refreshed the representative fixtures with `npm run seed --prefix octofit-tracker/backend` without clearing collections.
- Inspected all four live capability views in Chromium at 1440px and 390px widths. Seeded data rendered without horizontal overflow or browser runtime errors; reviewed desktop, mobile, and error screenshots.
- Submitted a five-minute walk through the activity form using existing user/team IDs. The API returned 201 with five points, the activity list refreshed, and the leaderboard displayed the updated Octocats total of 75 points.
- Requested workout suggestions for `nobody@example.com`: the API returned 404 and the UI displayed an accessible error alert. Retrying with `mona@example.com` restored suggestions, including Intervals.
- Protected grading contracts remained unchanged. Reviewed route/service separation, deliberate invalid-input responses, stable seed keys and membership reconciliation, shared frontend API usage, and environment-aware URLs.
- Remaining limitations: authentication is intentionally excluded. The contracts require existing user/team references, not cross-team membership enforcement; that broader policy remains a follow-up rather than an additional API restriction.
- The implementation had already reached main before Step 5. This final verification record supplies a reviewable follow-up pull request; final grading must run on its merged event.
