# Tasks — Iteration 4 (Scenario 4: Result, restart & final validation)

Goal: implement Scenario 4 behavior from `speckit.specify` using the approach in `speckit.plan`.

## Backend tasks (do first)

### B1 — Extend status model to include results

- **Depends on**: Scenario 3 complete
- **Change**:
  - `backend/src/models/game.ts`: add `"results"` to `RoomStatus`
- **Manual check**: `cd backend && npm run build`

### B2 — End round on first correct guess

- **Depends on**: B1
- **Change**:
  - `backend/src/services/roomStore.ts`:
    - in `submitGuess`, when guess is correct set `status = "results"`
    - block draw/clear/guess when status !== `"playing"`
- **Manual check**:
  - correct guess moves room to `results`
  - further guess/draw attempts rejected with clear message

### B3 — Reveal secret word to all viewers in results snapshots

- **Depends on**: B1, B2
- **Change**:
  - `toRoomSnapshot`: include `secretWord` for all viewers when status is `"results"`
- **Manual check**:
  - drawer and guesser snapshots both include word in results state

### B4 — Add host-only restart operation + route

- **Depends on**: B1
- **Change**:
  - `backend/src/services/roomStore.ts`: add `restartGame(code, requesterParticipantId)`
  - `backend/src/api/schemas.ts`: add restart schema
  - `backend/src/api/rooms.ts`: add `POST /rooms/:code/restart`
- **Manual check**:
  - host restart from results succeeds and clears round state
  - non-host restart returns 403
  - restart outside results returns 409

### B5 — Backend tests (recommended)

- **Depends on**: B2, B4
- **Change**:
  - `backend/src/services/roomStore.test.ts`
- **Manual check**: `cd backend && npm test` (if configured)

## Frontend tasks

### F1 — Extend API/types + restart store action

- **Depends on**: B4
- **Change**:
  - `frontend/src/services/api.ts`: `"results"` status + `restartGame` API
  - `frontend/src/state/roomStore.ts`: `restartGame()` action
- **Manual check**: `cd frontend && npm run build`

### F2 — Results UI (word, scores, history)

- **Depends on**: B2, B3, F1
- **Change**:
  - `frontend/src/components/ResultPanel.tsx`
  - `frontend/src/pages/GamePage.tsx` wiring
- **Manual check (two tabs)**:
  - after correct guess both tabs show same word/scores/history in results

### F3 — Disable gameplay controls after round end

- **Depends on**: F2
- **Change**:
  - `GamePage`, `GuessForm`, `DrawingCanvas` usage
  - disable guess/canvas interactions when status is `"results"`
- **Manual check**:
  - no further draw/guess actions possible in results state

### F4 — Host restart + auto return to lobby via polling

- **Depends on**: F1, B4
- **Change**:
  - `GamePage`: host-only restart button + waiting text for guests
  - `LobbyPage`/`GamePage`: navigate to lobby when snapshot status becomes `"lobby"`
- **Manual check (two tabs)**:
  - host restart returns both tabs to lobby within ~2s
  - participants preserved, round data cleared

### F5 — Final validation pass

- **Depends on**: all above
- **Manual check**:
  - full two-tab flow: create → join → start → play → correct guess → results → restart → lobby
  - `cd backend && npm run build`
  - `cd frontend && npm run build`

## Scenario 4 completion check (must pass)

- Results state is shared and complete (word, scores, history).
- Round-end locks gameplay mutations.
- Host-only restart clears round state and preserves players.
- All clients converge via polling and can replay start flow.
