# Reflection Report — Scribble Lab

## What the starter app already had

The starter was a runnable scaffold with:

- React routes for Start, Create Room, Join Room, Lobby, and Game
- A minimal Express API: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`, `GET /health`
- In-memory room storage with participant lists
- Placeholder game UI (canvas, guess form, scoreboard, results) without real gameplay logic
- Manual lobby refresh only (no polling)
- No host permissions, drawer assignment, secret word rules, scoring, or restart flow

## What I added

Work followed the Spec Kit loop: discovery → constitution → specify/plan/tasks per scenario → incremental implementation → validation.

### Artifacts

- `speckit.discovery.md` — gaps, assumptions, relevant files
- `speckit.constitution` — scope boundaries, deterministic rules, AI/review discipline
- `speckit.specify`, `speckit.plan`, `speckit.tasks` — four iterations aligned to Scenarios 1–4

### Scenario 1 — Room setup & lobby

- Host tracking on room creation
- Join validation with clear 400/404 errors
- Lobby polling (~2s)
- Host-only start with 2-player minimum
- Commits: `feat(rooms)`, `feat(join)`, `feat(lobby)`, `feat(game)`

### Scenario 2 — Game start & drawer flow

- Player name trim + non-empty validation
- Deterministic drawer assignment (host) and secret word selection (from room code)
- Drawer-only word visibility during `playing`
- Commits: `feat(players)`, `feat(game)`

### Scenario 3 — Gameplay interaction

- Drawer-only canvas draw/clear with synced strokes via polling
- Guess submission with trim, case-insensitive match, shared history, and scoring (+100 first correct, +0 incorrect)
- Commits: `feat(canvas)`, `feat(guesses)`, `feat(sync)`, `feat(scoring)`

### Scenario 4 — Result & restart

- Transition to `results` on first correct guess; word/scores/history visible to all
- Host-only restart clears round state and returns everyone to lobby via polling
- Commits: `feat(results)`, `feat(restart)`

## Decisions and tradeoffs

- **Polling over push**: kept HTTP polling (~2s) everywhere to match lab constraints; simple and sufficient for two-tab validation, but not real-time.
- **Deterministic word pick**: used room-code checksum modulo starter word list for repeatable behavior and easier manual testing.
- **First correct guess ends round**: single-round flow; avoids timers/multi-round complexity called out as out of scope.
- **Score once per player**: first correct guess awards 100; later correct guesses do not stack, keeping scoring predictable.
- **Minimal canvas model**: stored stroke paths rather than pixel buffers; easier to sync over REST but not optimized for high-frequency drawing.
- **Incremental commits**: each scenario split into small backend/frontend slices so changes stay traceable to spec acceptance criteria.

## AI usage

AI assisted with:

- Drafting and refining Spec Kit artifacts from README scenarios
- Exploring the starter codebase and proposing file-level plans
- Implementing slices incrementally with typed backend/frontend changes
- Smoke-testing API flows and build checks between commits

I reviewed AI output against `speckit.specify` acceptance criteria before committing, especially for permission rules (host/drawer/guesser), validation messages, and snapshot visibility (drawer-only word during play, all players in results).

## Traceability

Each implementation commit maps to a scenario slice in `speckit.tasks` and acceptance criteria in `speckit.specify`. Out-of-scope items from the README (WebSockets, databases, auth, multi-round rotation) were intentionally not implemented.

## Manual validation performed

- Two-tab flows for lobby sync, game start, drawing, guessing, results, and restart
- Backend and frontend `npm run build` after major slices
- API smoke checks for validation codes, role gating, and scoring/restart behavior
