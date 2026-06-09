# Plan — Iteration 2 (Scenario 2: Game start & drawer flow)

This plan extends the existing Scenario 1 implementation to satisfy Scenario 2 requirements: name validation, drawer assignment, deterministic word selection, and drawer-only word visibility.

## Backend plan (Scenario 2)

### Data model changes (`backend/src/models/game.ts`)

Add minimal fields required for a single round start:

- `Room.drawerParticipantId: string | null`
- `Room.secretWord: string | null`
- Extend `RoomSnapshot` to include:
  - `drawerParticipantId: string | null`
  - `viewerRole: "drawer" | "guesser"` (derived from viewer id)
  - `secretWord?: string` (present only for drawer viewer)

Rationale:
- Storing `drawerParticipantId` and `secretWord` on the room allows polling snapshots to be the single source of truth.
- Viewer-specific snapshot fields support “drawer-only visibility” without leaking data to guessers.

### Name validation (create/join)

- Update request validation in `backend/src/api/schemas.ts`:
  - `playerName` must be a string that trims to length ≥ 1 (reject whitespace-only).
- Update `backend/src/services/roomStore.ts`:
  - Normalize participant names by trimming before storing.

### Start-game behavior (`backend/src/services/roomStore.ts` + `backend/src/api/rooms.ts`)

On successful `startGame(code, requesterParticipantId)`:

- Set `room.status = "playing"` (already implemented).
- Set `drawerParticipantId` deterministically:
  - primary: `room.hostParticipantId`
  - fallback: `room.participants[0]?.id` (should exist if room exists)
- Set `secretWord` deterministically using the algorithm in `speckit.specify`:
  - `index = (sum of ASCII codes of room.code characters) % STARTER_WORDS.length`
  - `secretWord = STARTER_WORDS[index]`

Update `toRoomSnapshot(room, viewerParticipantId)`:
- Always include `drawerParticipantId`.
- Derive `viewerRole`:
  - `"drawer"` if `viewerParticipantId === drawerParticipantId`, else `"guesser"`.
- Include `secretWord` **only** when viewer is drawer (and viewer id is present and matches).

### Backend tests (recommended)

- `backend/src/services/roomStore.test.ts`:
  - name trimming behavior
  - drawer assignment
  - deterministic word selection for a given code
  - snapshot visibility rule (drawer gets `secretWord`, guesser does not)

## Frontend plan (Scenario 2)

### State model changes (`frontend/src/services/api.ts`)

- Extend `RoomSnapshot` type to match backend additions:
  - `drawerParticipantId: string | null`
  - `viewerRole: "drawer" | "guesser"`
  - `secretWord?: string`

### Create/Join validation (frontend forms)

- `frontend/src/pages/CreateRoomPage.tsx`:
  - trim player name on submit; reject whitespace-only with clear error.
- `frontend/src/pages/JoinRoomPage.tsx`:
  - apply same name validation (in addition to existing room code validation).

### Game UI updates (`frontend/src/pages/GamePage.tsx`)

- Display a clear role indicator based on snapshot:
  - If `viewerRole === "drawer"`: show “You are the drawer” and show `secretWord`.
  - Else: show “You are guessing” and do not show any word.

### Polling for in-game state (minimal for Scenario 2)

- Add game-page polling (about every 2 seconds) to keep drawer/word visibility consistent across tabs after start:
  - call `roomStore.fetchRoom()` on an interval while on `/game`
  - stop polling when leaving the page

## Files expected to change (Scenario 2)

### Backend
- `backend/src/models/game.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/rooms.ts` (start route response already exists; may only need snapshot shape updates)
- `backend/src/services/roomStore.test.ts` (recommended)

### Frontend
- `frontend/src/services/api.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- (maybe) `frontend/src/state/roomStore.ts` (if we add helpers; base fetch already exists)

## Manual verification checklist (Scenario 2)

- Create with `"   "` → blocked with clear message.
- Create with `"  Alice  "` → saved/displayed as `"Alice"`.
- Join with `"   "` → blocked; join with `" Bob "` → saved/displayed as `"Bob"`.
- Host starts with 2 players:
  - host sees “drawer” role + secret word
  - guesser sees “guesser” role and no secret word
- Refresh/polling keeps roles/visibility consistent.
