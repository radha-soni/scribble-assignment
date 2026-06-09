# Spec — Iteration 3 (Scenario 3: Gameplay interaction)

## Scope (in)

Implement Scenario 3 behavior for one active round:

- Drawer drawing interaction and clear-canvas action.
- Guess submission validation (trim input, reject empty).
- Case-insensitive comparison against the secret word.
- Guess history synchronized to all players via polling.
- Scoring rules:
  - scores start at 0
  - correct guess = +100
  - incorrect guess = +0

## Scope (out)

- Round result screen and restart flow (Scenario 4).
- Timers, countdowns, speed bonuses, drawer bonuses, multiple rounds.

## Definitions

- **Stroke**: one drawn segment on the shared canvas state.
- **Clear canvas**: action that resets current stroke/path state to empty.
- **Guess history**: ordered list of guesses with metadata (who guessed, guessed text, correctness, timestamp).
- **Case-insensitive match**: compare normalized strings using lowercase on both sides after trimming.

## Assumptions (to remove ambiguity)

- **Canvas authority**: only the drawer can mutate canvas state (draw/clear). Guessers are read-only viewers.
- **Guess normalization**: backend trims guess text before evaluation; empty-after-trim is rejected.
- **Scoring granularity**: each guess event is evaluated independently; a correct guess awards +100 for that submission.
- **History ordering**: guess history is displayed oldest-to-newest by server insertion order.
- **Sync mechanism**: all multiplayer synchronization remains HTTP polling (~2 seconds).

## Acceptance criteria

### A. Drawing interaction + clear canvas

- While room status is `playing`, drawer can:
  - draw strokes on canvas
  - clear the canvas explicitly
- Guesser behavior:
  - cannot draw or clear
  - sees synchronized canvas state updates via polling
- After clear:
  - canvas state is empty for all players within polling window (~2s)

### B. Guess validation

- Guess submission trims whitespace before processing.
- Empty/whitespace-only guesses are rejected with a clear message.
- UI does not crash on rejected guesses.

### C. Case-insensitive correctness

- Guess is compared against secret word case-insensitively and trimmed.
- Examples (if word is `pizza`):
  - `Pizza`, `PIZZA`, `  pizza  ` are correct.
  - `pizz` or `pizza!` are incorrect unless explicitly normalized to remove punctuation (not required in this iteration).

### D. Guess history sync via polling

- Every accepted guess (correct or incorrect) is appended to shared guess history.
- All players see the same ordered history within ~2 seconds via polling.
- History entries include enough context to render:
  - player identity/name
  - guess text (normalized or original, consistently defined)
  - correctness flag

### E. Scoring behavior

- Scoreboard initializes all participants at 0 when game enters `playing`.
- Incorrect guess adds 0 (no change).
- Correct guess adds +100 to the guessing player.
- Score updates are visible to all players via polling.

## Edge cases

- Drawer submitting guesses via UI/API should be blocked or ignored consistently (explicitly non-scoring).
- Repeated correct guesses by same player are allowed in this iteration unless blocked by backend rule; if blocked, backend must return clear message and keep score stable.
- Guess submitted by unknown/invalid participant id is rejected safely.
- Clearing an already-empty canvas is a no-op (no crash).

## Manual verification checklist (Scenario 3)

- **Canvas controls**:
  - Drawer can draw and clear.
  - Guesser cannot mutate canvas.
- **Guess validation**:
  - Submit `"   "` → clear error message.
  - Submit `"  pizza  "` when word is pizza → evaluated correctly.
- **Case-insensitive match**:
  - `PIZZA` equals `pizza`.
- **History sync** (two tabs):
  - guesses from one tab appear on the other within ~2 seconds.
- **Scoring**:
  - initial scores are 0.
  - incorrect guess leaves score unchanged.
  - correct guess increases that player by exactly +100.
