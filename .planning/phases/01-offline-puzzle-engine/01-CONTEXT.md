# Phase 1: Offline Puzzle Engine - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The core puzzle engine delivering deterministic daily puzzles generated purely on the client side without database round trips. This phase includes the architecture for executing the logic puzzles, establishing seed-based generation, validation logic, and caching state to IndexedDB for offline support and zero latency.

</domain>

<decisions>
## Implementation Decisions

### Engine Architecture
- **D-01:** Pure functional pattern. We will use stateless functions for game logic validations and custom React Hooks for integrating state. It keeps the core logic decoupled from the UI.

### Seed Strategy
- **D-02:** Seeded PRNG with date string (e.g., `YYYY-MM-DD`). We will use a predictable math-based pseudorandom number generator using today's date so all clients receive the exact same puzzle layout.

### Storage Schema
- **D-03:** Single JSON blob per day stored in IndexedDB via `idb`. The key will be the date string mapping to an object: `{ puzzleState, moveHistory, hintUses }`. This allows atomic updates and O(1) daily reads.

### Puzzle Extensibility
- **D-04:** Static React component dictionary mapping. A centralized map linking a puzzle type enum/string directly to the logic rule set and entry React Component.

### the agent's Discretion
- The exact PRNG implementation (e.g., XorShift or Mulberry32).
- IndexedDB database and object store naming conventions.
- Folder placement inside `src/lib/engine`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundational Constraints
- `.planning/PROJECT.md` — Explains the client-first architecture goals.
- `.planning/REQUIREMENTS.md` — Explains the deterministic nature required of the engine and the UI behavior mechanics.

</canonical_refs>
