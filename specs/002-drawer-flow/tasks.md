# Tasks — Iteration 2 (Scenario 2: Game start & drawer flow)

Goal: implement Scenario 2 behavior from `speckit.specify` using the approach in `speckit.plan`.

## Backend tasks (do first)

### B1 — Extend room model for round start state

- **Depends on**: Scenario 1 code merged
- **Change**:
  - `backend/src/models/game.ts`
    - add `drawerParticipantId` and `secretWord` to `Room`
    - add `drawerParticipantId`, `viewerRole`, and conditional `secretWord` to `RoomSnapshot`
- **Manual check**: `cd backend && npm run build`

### B2 — Enforce player name trim + non-empty on create/join

- **Depends on**: none
- **Change**:
  - `backend/src/api/schemas.ts`
    - require `playerName` as a trimmed non-empty string (clear error message)
  - `backend/src/services/roomStore.ts`
    - trim names before storing participant
- **Manual check**:
  - Create/join with `"   "` returns 400 + clear message.
  - Create/join with `"  Alice  "` stores/display `"Alice"`.

### B3 — Deterministic drawer assignment + word selection on start

- **Depends on**: B1
- **Change**:
  - `backend/src/services/roomStore.ts`:
    - on successful `startGame`, set:
      - `drawerParticipantId` (host, else first participant)
      - `secretWord` using the defined deterministic algorithm
    - update `toRoomSnapshot(room, viewerParticipantId)`:
      - include `drawerParticipantId`
      - set `viewerRole`
      - include `secretWord` only for drawer viewer
- **Manual check**:
  - Start game, then `GET /rooms/:code?participantId=<drawer>` includes `secretWord`.
  - Same request for guesser does **not** include `secretWord`.

### B4 — Backend tests (recommended)

- **Depends on**: B2, B3
- **Change**:
  - `backend/src/services/roomStore.test.ts`
- **Manual check**: `cd backend && npm test` (if configured)

## Frontend tasks

### F1 — Update RoomSnapshot types for drawer/word fields

- **Depends on**: B1, B3
- **Change**:
  - `frontend/src/services/api.ts`
    - add `drawerParticipantId`, `viewerRole`, and optional `secretWord`
- **Manual check**: `cd frontend && npm run build`

### F2 — Enforce player name trim + non-empty in Create/Join UI

- **Depends on**: B2 (backend enforcement), but can be implemented in parallel
- **Change**:
  - `frontend/src/pages/CreateRoomPage.tsx`
  - `frontend/src/pages/JoinRoomPage.tsx`
- **Manual check**:
  - Both forms show clear error on whitespace-only names.

### F3 — Game UI: show role and drawer-only secret word

- **Depends on**: F1, B3
- **Change**:
  - `frontend/src/pages/GamePage.tsx`
    - show “You are the drawer” + word when `viewerRole === "drawer"`
    - show “You are guessing” and no word otherwise
- **Manual check (2 tabs)**:
  - Host sees word; guesser does not.

### F4 — Game polling for snapshot refresh (~2s)

- **Depends on**: existing `roomStore.fetchRoom()`
- **Change**:
  - `frontend/src/pages/GamePage.tsx`
    - add ~2s polling to keep snapshot current post-start
- **Manual check (2 tabs)**:
  - Refreshing tabs and waiting shows consistent role/word visibility with no manual actions.

## Scenario 2 completion check (must pass)

- Names are trimmed and whitespace-only is rejected (frontend + backend).
- Drawer assignment is deterministic and visible to all.
- Secret word selection is deterministic.
- Secret word is visible only to drawer (no leakage via API snapshot).
