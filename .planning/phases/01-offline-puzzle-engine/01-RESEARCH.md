# Phase 1: Research - Offline Puzzle Engine

## Objective
Establish the architecture for generating, executing, verifying, and persisting daily puzzles fully on the client side using deterministic seeds.

## 1. Seeded Pseudorandom Number Generation (PRNG)
- **Requirement:** ENG-04 mandates deterministic generation using a date seed.
- **Approach:** Mulberry32 is the industry standard for lightweight seeded PRNG in JavaScript. It is fast, mathematically simple, and predictable. 
- **Implementation:** Convert a date string (e.g., `YYYY-MM-DD`) into a 32-bit integer seed hash using a standard hashing function (like MurmurHash3 or a simple bitwise string hasher), and feed that seed into Mulberry32 to produce random numbers between $0$ and $1$.

## 2. IndexedDB Integration with `idb`
- **Requirement:** ENG-06 demands local state persistence.
- **Library:** The project stack mandates the use of `idb` by Jake Archibald.
- **Schema Design:** We will create a `logic-looper` database with an object store named `daily-state`. Keyed by the `YYYY-MM-DD` string, the values will be the state object `{ id, puzzleType, moves: [], isSolved: boolean, hintsUsed: 0, startTime: number }`.

## 3. Puzzle Type Registry & Mechanics
- **Requirement:** MCH-04 mandates multiple puzzle variations.
- **Strategy:** Each puzzle type will have a common interface: `PuzzleLogicType`.
  ```typescript
  interface PuzzleLogicType {
    generate(seed: number): PuzzleState;
    validate(currentState: PuzzleState): boolean;
    getHint(currentState: PuzzleState): Hint; // For MCH-03
  }
  ```
- **Registry:** A central factory map `PuzzleRegistry` that returns the correct logic module. The specific puzzle type for the day can also be derived from the seeded RN (e.g., `types[Math.floor(random() * types.length)]`).

## 4. Offline Capabilities
- **Requirement:** ENG-07 completely offline support.
- **Strategy:** Next.js App Router doesn't perfectly default to PWA. We will architect the core mechanics with standard context hooks so that we don't rely on `fetch` data fetching or server actions during gameplay.

## Validation Architecture
- **Dimensions:** Dimension 1 (Logic Validations, e.g., puzzle state checks), Dimension 2 (State Transitions, e.g., tracking solved times).
- **Tooling:** Test the `Mulberry32` generator in Jest. Test the puzzle validation logic extensively. We should write tests that assert multiple passes of the same date string produce identical outputs.
