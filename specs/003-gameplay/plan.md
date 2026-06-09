# Plan — Iteration 3 (Scenario 3: Gameplay interaction)

This plan extends Scenario 2 with real gameplay interactions: canvas draw/clear, guess handling, shared history, and scoring.

## Backend plan (Scenario 3)

### Data model updates (`backend/src/models/game.ts`)

Add gameplay state to `Room`:

- `canvasStrokes: CanvasStroke[]` (or minimal line/point schema)
- `guesses: GuessEntry[]`
- `scores: Record<string, number>` keyed by participant id

Add snapshot fields to `RoomSnapshot`:

- `canvasStrokes`
- `guesses`
- `scores`

Add supporting types:

- `CanvasStroke` with stable shape (id, points, color, width, createdBy, createdAt)
- `GuessEntry` with (id, participantId, participantName, guess, isCorrect, createdAt)

### Store initialization and invariants (`backend/src/services/roomStore.ts`)

- On room creation/join:
  - ensure scores map is present (join initializes new participant score to 0)
- On `startGame`:
  - initialize/reset round state for Scenario 3:
    - `canvasStrokes = []`
    - `guesses = []`
    - `scores` contains all participants with 0 (for first round)

### New backend operations and endpoints

Add route handlers in `backend/src/api/rooms.ts` with Zod schemas in `backend/src/api/schemas.ts`:

- `POST /rooms/:code/canvas/strokes`
  - body: `{ participantId, stroke }`
  - only drawer can add stroke (403 otherwise)
- `POST /rooms/:code/canvas/clear`
  - body: `{ participantId }`
  - only drawer can clear (403 otherwise)
- `POST /rooms/:code/guesses`
  - body: `{ participantId, guess }`
  - trim guess; reject empty (400)
  - compare case-insensitively to `secretWord`
  - append guess history entry
  - score update: +100 if correct, +0 if incorrect

All endpoints return updated room snapshot.

### Validation rules (`backend/src/api/schemas.ts`)

- Guess schema:
  - `guess` is string, trimmed, min length 1
- Canvas stroke schema:
  - enforce required fields and reasonable limits (non-empty points list)
- Participant id required for all gameplay mutations.

### Snapshot and security behavior

- Keep existing drawer-only secret word visibility rule.
- `guesses`, `scores`, and `canvasStrokes` are visible to all players in room.
- Reject mutations from unknown participant ids.

### Backend tests (recommended)

- `backend/src/services/roomStore.test.ts`:
  - draw/clear permissions
  - guess validation (empty rejected)
  - case-insensitive correctness
  - score transitions (0 -> +100 on correct, unchanged on incorrect)
  - guess history ordering and shared snapshot consistency

## Frontend plan (Scenario 3)

### API surface (`frontend/src/services/api.ts`)

Add methods:

- `addCanvasStroke(code, participantId, stroke)`
- `clearCanvas(code, participantId)`
- `submitGuess(code, participantId, guess)`

Extend `RoomSnapshot` type with:

- `canvasStrokes`
- `guesses`
- `scores`

### State store updates (`frontend/src/state/roomStore.ts`)

Add store actions that call API and replace snapshot:

- `addCanvasStroke(stroke)`
- `clearCanvas()`
- `submitGuess(guess)`

Keep `fetchRoom()` as the polling sync path for all tabs.

### Game UI updates (`frontend/src/pages/GamePage.tsx` + components)

- Canvas area:
  - replace placeholder with interactive canvas for drawer
  - render existing `canvasStrokes` for all viewers
  - show clear button for drawer only
- Guess form:
  - enabled for guessers only
  - submits through `roomStore.submitGuess`
  - shows validation/server errors
- Guess history panel:
  - render shared `guesses` from snapshot
- Scoreboard:
  - render from snapshot `scores` + participants

### Polling and sync

- Reuse GamePage polling (~2s) to keep canvas, guesses, and scores synced across tabs.
- Mutation actions update initiating client immediately via response snapshot; other clients converge via polling.

## Files expected to change (Scenario 3)

### Backend
- `backend/src/models/game.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/rooms.ts`
- `backend/src/services/roomStore.test.ts` (recommended)

### Frontend
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/GuessForm.tsx` (if props/state contract changes)
- `frontend/src/components/Scoreboard.tsx`
- `frontend/src/components/ResultPanel.tsx` (may remain placeholder)
- `frontend/src/styles/app.css` (canvas/guess-history styling)

## Manual verification checklist (Scenario 3)

- Drawer can draw and clear; guesser cannot mutate canvas.
- Guess form rejects empty/whitespace-only guesses with clear message.
- Case-insensitive correctness works (`PIZZA` matches `pizza`).
- Guess history appears in order and syncs across two tabs within ~2s.
- Scoreboard starts at 0 for all players; correct guess adds +100, incorrect adds +0.
