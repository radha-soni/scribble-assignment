# Spec — Iteration 4 (Scenario 4: Result, restart & final validation)

## Scope (in)

Implement Scenario 4 behavior for the single-round flow:

- Transition room to a shared **results** state when the round ends.
- Show results to all players: correct word, final scores, full guess history.
- Allow **host-only restart** that returns all players to lobby with participants preserved and round state cleared.

## Scope (out)

- Multiple rounds with drawer rotation.
- Timers, countdowns, bonuses.
- Persistent storage or auth.

## Definitions

- **Round end**: the room transitions from `playing` to `results` when any guesser submits a **correct** guess.
- **Results state**: room status is `"results"`; all players can see the revealed word and final round summary.
- **Restart**: host action that resets round-specific state and sets room status back to `"lobby"`.

## Assumptions (to remove ambiguity)

- **Round-end trigger**: first correct guess ends the round immediately (no further guesses accepted after transition).
- **Word reveal in results**: during `results`, the secret word is visible to **all** players in snapshots (not drawer-only).
- **Restart permissions**: only the host can restart; non-host attempts are rejected with clear feedback.
- **Restart navigation**: all tabs observe `status === "lobby"` via polling and navigate back to `/lobby`.

## Acceptance criteria

### A. Result state shown to all

- When the round ends, room status becomes `"results"`.
- All players see, via polling/UI:
  - the correct secret word
  - final scores for all participants
  - full guess history from the round (ordered oldest → newest)
- Result UI is consistent across tabs within ~2 seconds.

### B. Round-end behavior

- After transition to `results`:
  - no additional guesses are accepted (400/409 with clear message)
  - drawer cannot draw/clear (403/409 with clear message)
- Existing guesses/scores/canvas/history remain visible for results display.

### C. Host-only restart

- Host can restart from results state.
- Non-host restart attempts are rejected (403) with clear message.
- On successful restart:
  - room status returns to `"lobby"`
  - participants and host identity are preserved
  - round state is cleared:
    - `drawerParticipantId = null`
    - `secretWord = null`
    - `canvasStrokes = []`
    - `guesses = []`
    - `scores` reset for all current participants to `0`

### D. Post-restart lobby sync

- All players automatically return to lobby UI via polling (~2s) after restart.
- Lobby shows preserved participants and host indicator.
- Host can start a new round once ≥2 players are present (reusing existing start rules).

## Edge cases

- If multiple tabs submit a correct guess nearly simultaneously, room ends once and remains in stable `results` state.
- Restart while not in `results` is rejected with clear message.
- Restart with missing/invalid host participant id is rejected safely.
- Unknown participant id on restart returns clear error without mutating room state.

## Manual verification checklist (Scenario 4)

- **End-to-end round** (two tabs):
  - create → join → start → play → submit correct guess.
- **Results visibility**:
  - both tabs show correct word, final scores, and full guess history.
- **Post-end restrictions**:
  - further guess/canvas actions are blocked with clear feedback.
- **Restart**:
  - host restart returns both tabs to lobby; players remain.
  - round fields are cleared (no old word/canvas/guesses/scores leakage).
- **Final validation**:
  - `cd backend && npm run build`
  - `cd frontend && npm run build`
  - repeat full flow including restart back to lobby.
