# Discovery Notes — Scribble Starter (Phase 0)

## What the starter already provides

- Frontend routes/screens for Start, Create Room, Join Room, Lobby, and Game.
- Minimal REST backend with in-memory room store:
  - `GET /health`
  - `POST /rooms`
  - `POST /rooms/:code/join`
  - `GET /rooms/:code`
- Room snapshot includes participant list plus starter seed lists:
  - words: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`
  - roles: `drawer`, `guesser`

## Key incomplete behaviors observed (gaps vs README scenarios)

- **No host concept / permissions**
  - Room creation does not record a host participant id.
  - Lobby “Start Game” is just a navigation button; there is no backend “start game” action, no host-only gating, and no 2-player minimum enforcement.

- **No automatic polling**
  - Lobby state updates only via a manual “Refresh Room” button; no ~2s polling loop.
  - There is no game-state polling at all (guesses, results, etc.).

- **Gameplay state model is missing**
  - `RoomStatus` is only `"lobby"`; there is no `"playing"` or `"results"` state.
  - No drawer assignment, no secret word selection/storage, and no “drawer-only visibility”.
  - No guess submission endpoint/state, no guess history, no scoring, no result state, no restart flow.

- **Validation is permissive / not aligned to scenarios**
  - `playerName` is optional on create/join; backend coerces missing to `"Player"` and does not trim or reject whitespace-only names.
  - `roomCode` param schema is `z.string()` (no length/format validation), so “invalid/empty codes rejected with clear feedback” is not implemented.

- **Viewer-specific snapshot logic is not implemented**
  - Backend `toRoomSnapshot(room, viewerParticipantId)` currently ignores `viewerParticipantId`.
  - This will matter for “secret word visible only to drawer”.

- **Potential API base URL bug in frontend**
  - `frontend/src/services/api.ts` defaults `VITE_API_URL` to `http://localhost:3001/bug` (appending `/bug`).
  - Without a proxy, this would call `/bug/rooms` which the backend does not serve. The README “Quick Verification” implies the starter works, so this may rely on an environment override or be an intentional scaffold flaw.

## Assumptions (to resolve ambiguity while staying deterministic)

- **A1 — Host definition**
  - The creator of the room is the host.
  - Store `hostParticipantId` on the room and expose it in snapshots so the frontend can gate host-only actions.

- **A2 — Polling strategy**
  - Implement client polling with `setInterval` (about every 2000ms) in screens that must stay fresh (Lobby and Game).
  - Polling will call `GET /rooms/:code?participantId=...` and replace the room snapshot in the store.

- **A3 — Deterministic word selection**
  - Select the secret word deterministically from the starter word list using a stable input (e.g., room code) so it is repeatable and testable without randomness.

- **A4 — Drawer assignment**
  - Drawer for the single-round game is the host (or, if host is missing for any reason, the first participant in the room).

## Relevant files inspected (likely to be touched later)

### Backend
- Routes and validation:
  - `backend/src/api/rooms.ts`
  - `backend/src/api/schemas.ts`
  - `backend/src/api/router.ts`
- In-memory room store + snapshot:
  - `backend/src/services/roomStore.ts`
- Types + state model:
  - `backend/src/models/game.ts`
- Seed data:
  - `backend/src/seed/starterData.ts`

### Frontend
- Room client + types:
  - `frontend/src/services/api.ts`
  - `frontend/src/state/roomStore.ts`
- Screens:
  - `frontend/src/pages/CreateRoomPage.tsx`
  - `frontend/src/pages/JoinRoomPage.tsx`
  - `frontend/src/pages/LobbyPage.tsx`
  - `frontend/src/pages/GamePage.tsx`

## Notes / risks to track

- Ensure all “sync” remains HTTP polling (explicitly no websockets).
- Backend is in-memory only; restarting backend wipes all rooms (expected).
- If the API base URL default really is wrong, we will need to fix it early (otherwise later work can’t be verified in two tabs).

