# Plan — Iteration 4 (Scenario 4: Result, restart & final validation)

This plan extends Scenario 3 to add round completion (`results`) and host restart back to lobby.

## Backend plan (Scenario 4)

### Data model updates (`backend/src/models/game.ts`)

- Extend `RoomStatus`:
  - `"lobby" | "playing" | "results"`
- No new persistent entities required beyond status transition semantics.
- Snapshot behavior changes:
  - when `status === "results"`, include `secretWord` for all viewers (not drawer-only).

### Round-end transition (`backend/src/services/roomStore.ts`)

- In `submitGuess`:
  - after recording a correct guess and applying score (+100 first time only, existing rule),
  - set `room.status = "results"`.
- Guard gameplay mutations:
  - reject draw/clear/guess when status is not `playing`.

### Restart operation + route

Add `restartGame(code, requesterParticipantId)` in `roomStore`:

- validate room exists
- validate status is `"results"`
- validate requester is host
- reset round fields:
  - `status = "lobby"`
  - `drawerParticipantId = null`
  - `secretWord = null`
  - `canvasStrokes = []`
  - `guesses = []`
  - `scores = initialScores(participants)` (all zeros)
- preserve `participants` and `hostParticipantId`

Add route:

- `POST /rooms/:code/restart`
  - body: `{ participantId }`
  - errors:
    - 404 room/participant not found
    - 403 non-host
    - 409 if not in results
  - success: updated snapshot

Add schema in `backend/src/api/schemas.ts`:

- `restartGameSchema` (same shape as start: `{ participantId }`)

### Snapshot updates (`toRoomSnapshot`)

- If `room.status === "results"` and `room.secretWord` exists:
  - include `secretWord` for every viewer.
- Keep existing drawer-only visibility rule for `playing`.

## Frontend plan (Scenario 4)

### API + types (`frontend/src/services/api.ts`)

- Extend status union to include `"results"`.
- Add `api.restartGame(code, participantId)`.

### Store (`frontend/src/state/roomStore.ts`)

- Add `restartGame()` action updating snapshot from API response.

### UI behavior

- `ResultPanel` (`frontend/src/components/ResultPanel.tsx`):
  - when `status === "results"`, show:
    - correct word
    - final scores
    - full guess history (or reuse `GuessHistory`)
- `GamePage`:
  - disable guess/canvas controls when not `playing`
  - show host-only **Restart Game** button in results
  - non-host sees waiting message
- Navigation sync:
  - `GamePage`: if status becomes `results`, stay on game page but show results panel
  - `LobbyPage`/`GamePage`: navigate to lobby when snapshot status becomes `"lobby"` while on game route
  - after host restart, all tabs return to lobby via polling

## Files expected to change (Scenario 4)

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
- `frontend/src/pages/LobbyPage.tsx` (optional redirect safety)
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/styles/app.css` (results/restart styling)

## Manual verification checklist (Scenario 4)

- Correct guess transitions both tabs to results view with shared word/scores/history.
- Post-results gameplay actions are blocked.
- Host restart returns all tabs to lobby; players preserved; round state cleared.
- Backend/frontend builds pass.
