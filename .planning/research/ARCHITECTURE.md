# ARCHITECTURE

## System Structure
- **Game Engine (Client)**: A purely deterministic logic module. Given a seed (e.g., `YYYY-MM-DD`), it outputs identically constrained puzzles globally.
- **Progress Manager**: Saves interactions and timer constraints into IndexedDB on every move limit/change.
- **Sync Worker**: A background routine (or fallback API call) that pushes completed runs to the backend `/api/scores` for leaderboard matching.

## Data Flow
1. Load Page → Check Authentication (NextAuth).
2. Read Local Storage → If puzzle of the day exists partially solved, resume. Otherwise, invoke Game Engine with today's date.
3. User interacts → Component triggers Redux action → Engine evaluates state compliance.
4. User wins (or loses) → Local state finalized → Request sent to Postgres to log the `daily_score`.

## Build Order
1. Build deterministic Engine & Puzzle Generics.
2. Build IndexedDB persistence shell mechanism.
3. Setup Sync Layer to Postgres.
