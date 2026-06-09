# Spec — Iteration 2 (Scenario 2: Game start & drawer flow)

## Scope (in)

Implement Scenario 2 behavior (first round start semantics only):

- Player names are trimmed on create/join; empty/whitespace-only is rejected with a clear message.
- When the first round begins, a drawer is assigned deterministically (host / first player).
- Secret word is selected deterministically from the starter list.
- Secret word visibility is restricted: **drawer-only**.

## Scope (out)

- No drawing mechanics (canvas sync) yet.
- No guess submission, scoring, results, or restart (Scenario 3+).
- No websockets; polling only.

## Definitions

- **Drawer**: the participant responsible for drawing in the single round.
- **Guesser**: any non-drawer participant in the room.
- **Secret word**: the word that guessers attempt to guess; selected from the starter word list.
- **Deterministic selection**: given the same room code and seed list, selection always yields the same word.

## Assumptions (to remove ambiguity)

- **Drawer assignment**: the **host** is the drawer for the single round. (If host is missing, fall back to the first participant.)
- **Word selection algorithm**:
  - Use the starter word list in `backend/src/seed/starterData.ts`.
  - Compute `index = (sum of ASCII codes of room code characters) % words.length`.
  - The secret word is `words[index]`.
- **Visibility rule**:
  - Room snapshots may include `secretWord` only when the viewer is the drawer.
  - Non-drawers must not receive `secretWord` in snapshots (not even as masked text).

## Acceptance criteria

### A. Player name validation (trim + reject empty)

- Create room:
  - leading/trailing whitespace is removed before saving the participant name.
  - if the submitted name is empty after trimming, the request is rejected with a clear message.
- Join room:
  - same trimming + empty rejection applies.
- Frontend provides immediate feedback (form error message) and backend enforces the same rule (defense in depth).

### B. Drawer assignment at start

- When the host starts the game (transition to `playing`):
  - a `drawerParticipantId` is set for the room, deterministically based on host/first participant.
- In the Game UI:
  - the drawer is clearly identified to all players (e.g., “You are the drawer” vs “You are guessing”).

### C. Deterministic secret word selection

- When the room enters `playing` the first time:
  - the secret word is chosen deterministically from the starter list using the defined algorithm.
- Determinism checks:
  - restarting the backend and repeating the same room code selection method yields the same word for that code.
  - different room codes can map to different words (not required, but allowed).

### D. Drawer-only secret word visibility

- Drawer sees the secret word in the Game UI.
- Guessers do not see the secret word anywhere in the UI.
- API rule:
  - the server only includes the secret word in snapshots for the drawer viewer.
  - guessers’ snapshots must omit the field entirely.

## Edge cases

- Names like `"   Alice   "` become `"Alice"`.
- Names like `"   "` are rejected with a clear message.
- Two players can use the same display name; uniqueness is by participant id.
- If a viewer refreshes without a valid `participantId`, the backend must not leak the secret word.

## Manual verification checklist (Scenario 2)

- **Name validation**:
  - Create with `"   "` → rejected with clear message.
  - Create with `"  Alice  "` → shows `"Alice"` in lobby/game.
  - Join with `"   "` → rejected; join with `"  Bob "` → saved as `"Bob"`.
- **Drawer + word** (two tabs):
  - Host starts → host is the drawer.
  - Drawer sees secret word; guesser does not.
  - Refresh both tabs → visibility rule remains true after polling.
