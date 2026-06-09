# Tasks — Iteration 3 (Scenario 3: Gameplay interaction)

Goal: implement Scenario 3 behavior from `speckit.specify` using the approach in `speckit.plan`.

## Backend tasks (do first)

### B1 — Extend room/gameplay state types

- **Depends on**: Scenario 2 complete
- **Change**:
  - `backend/src/models/game.ts`
    - add `CanvasStroke` and `GuessEntry` types
    - add room fields: `canvasStrokes`, `guesses`, `scores`
    - expose these in `RoomSnapshot`
- **Manual check**: `cd backend && npm run build`

### B2 — Initialize/reset gameplay state correctly

- **Depends on**: B1
- **Change**:
  - `backend/src/services/roomStore.ts`
    - initialize new room gameplay state
    - ensure joining player gets score initialized to 0
    - reset `canvasStrokes` + `guesses` + `scores` when game starts (Scenario 3 single-round start)
- **Manual check**:
  - After start, all participants have score 0 and empty history/canvas.

### B3 — Add canvas mutation endpoints (drawer-only)

- **Depends on**: B1, B2
- **Change**:
  - `backend/src/api/schemas.ts`: canvas stroke/clear schemas
  - `backend/src/services/roomStore.ts`: add stroke/clear operations with role checks
  - `backend/src/api/rooms.ts`:
    - `POST /rooms/:code/canvas/strokes`
    - `POST /rooms/:code/canvas/clear`
- **Manual check**:
  - Drawer can add stroke/clear; guesser receives 403.

### B4 — Add guess submission endpoint and scoring

- **Depends on**: B1, B2
- **Change**:
  - `backend/src/api/schemas.ts`: guess schema (trim, min 1)
  - `backend/src/services/roomStore.ts`:
    - add guess submission operation
    - case-insensitive compare to secret word
    - append history entries
    - apply scoring (+100 correct, +0 incorrect)
  - `backend/src/api/rooms.ts`:
    - `POST /rooms/:code/guesses`
- **Manual check**:
  - whitespace guess rejected (400)
  - correct guess increments by 100
  - incorrect guess leaves score unchanged

### B5 — Backend tests (recommended)

- **Depends on**: B3, B4
- **Change**:
  - `backend/src/services/roomStore.test.ts`
- **Manual check**: `cd backend && npm test` (if configured)

## Frontend tasks

### F1 — Extend API + snapshot types for gameplay state

- **Depends on**: B1-B4 contracts
- **Change**:
  - `frontend/src/services/api.ts`
    - add `canvasStrokes`, `guesses`, `scores` to snapshot typing
    - add API methods for stroke/clear/guess mutations
- **Manual check**: `cd frontend && npm run build`

### F2 — Add gameplay actions to room store

- **Depends on**: F1
- **Change**:
  - `frontend/src/state/roomStore.ts`
    - `addCanvasStroke`, `clearCanvas`, `submitGuess`
    - each action updates local snapshot from API response
- **Manual check**:
  - invoking actions updates room snapshot without full-page refresh.

### F3 — Implement interactive canvas + clear behavior

- **Depends on**: F1, F2
- **Change**:
  - `frontend/src/pages/GamePage.tsx`
  - optional helper component(s) if needed
  - `frontend/src/styles/app.css`
- **Manual check (two tabs)**:
  - drawer draws and clears
  - guesser sees updates via polling
  - guesser cannot draw/clear

### F4 — Wire guess submission and validation UI

- **Depends on**: F1, F2
- **Change**:
  - `frontend/src/components/GuessForm.tsx` and `frontend/src/pages/GamePage.tsx`
    - trim input
    - reject empty with clear message
    - submit valid guesses via store action
- **Manual check**:
  - empty guess blocked with message
  - valid guesses submit and appear in history

### F5 — Render synced guess history + scoring

- **Depends on**: F1, F2, F4
- **Change**:
  - `frontend/src/pages/GamePage.tsx`
  - `frontend/src/components/Scoreboard.tsx`
  - optional history UI section/component
- **Manual check (two tabs)**:
  - guesses appear in same order on both tabs within ~2s
  - scoreboard starts at 0 for all
  - correct guess +100, incorrect +0

## Scenario 3 completion check (must pass)

- Drawer-only draw/clear permissions are enforced.
- Guess input is trimmed and empty rejected with clear feedback.
- Correctness comparison is case-insensitive.
- Guess history syncs across players via polling.
- Scoring rules are deterministic and match +100/+0 with 0 initial scores.
