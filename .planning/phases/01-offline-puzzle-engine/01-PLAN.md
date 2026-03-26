---
wave: 1
depends_on: []
files_modified:
  - "src/lib/engine/prng.ts"
  - "src/lib/engine/storage.ts"
  - "src/lib/engine/types.ts"
  - "src/lib/engine/puzzles/number-matrix.ts"
  - "src/lib/engine/registry.ts"
  - "src/hooks/useDailyPuzzle.ts"
autonomous: true
---

# Phase 1: Offline Puzzle Engine

## Objective
Establish the core offline client-side logic engine capable of deterministically generating and verifying daily puzzles seeded by the current date, with game state synced fully to IndexedDB via the `idb` library.

## Requirements Addressed
- ENG-04: Deterministic random generation using date seed.
- ENG-05: Instant client-side validation logic.
- ENG-06: IndexedDB save mechanisms for move history and prevention of progress loss.
- ENG-07: Completely offline functionality.
- MCH-04: Foundational architecture for supporting sequentially varying puzzle types.

## Tasks

<task>
<id>1</id>
<title>Seeded Pseudorandom Number / Hashing Utils</title>
<description>
Create the `src/lib/engine/prng.ts` module containing deterministic utility functions.
We will need a function to hash a standard date string ("YYYY-MM-DD") into a 32-bit integer seed, and a Mulberry32 PRNG generator class/closure to output floats between 0 and 1.
</description>
<read_first>
- `.planning/phases/01-offline-puzzle-engine/01-CONTEXT.md`
</read_first>
<action>
1. Create `src/lib/engine/prng.ts` if it doesn't exist.
2. Export a function `hashString(str: string): number` that performs a simple robust bitwise hash on a string to generate a 32-bit integer.
3. Export a function `createPRNG(seed: number): () => number` that returns a `Mulberry32` generator function yielding floats strictly in `[0, 1)`.
4. Export a helper `getDateSeed(dateString: string): number` which combines them.
</action>
<acceptance_criteria>
- `src/lib/engine/prng.ts` exists and exposes `hashString`, `createPRNG`, and `getDateSeed` functions.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Puzzle Architecture TypeScript Types</title>
<description>
Define the global types required for the diverse puzzle mechanics across the app.
</description>
<read_first>
- `src/lib/engine/prng.ts`
</read_first>
<action>
1. Create `src/lib/engine/types.ts`.
2. Define `PuzzleType` enum with values: `NUMBER_MATRIX`, `PATTERN`, `SEQUENCE`, `DEDUCTION`, `BINARY`.
3. Define `GameState` generic interface: `interface GameState<T> { date: string; type: PuzzleType; puzzleData: T; moves: any[]; isSolved: boolean; startTime: number; lastUpdated: number; }`.
4. Define `PuzzleEngine<T>` interface: `interface PuzzleEngine<T> { generate(prng: () => number): T; validate(currentState: T): boolean; }`.
</action>
<acceptance_criteria>
- `src/lib/engine/types.ts` contains `PuzzleType` enum.
- `src/lib/engine/types.ts` contains `GameState` generic shape.
- `src/lib/engine/types.ts` contains `PuzzleEngine` generic shape.
</acceptance_criteria>
</task>

<task>
<id>3</id>
<title>Local Storage IndexedDB Wrapper (idb)</title>
<description>
Implement atomic operations tying IndexedDB to the GameState definitions utilizing `idb`. Since we are using Next.js 16.2 with Node for SSR, ensure `idb` executes strictly client-side.
</description>
<read_first>
- `src/lib/engine/types.ts`
</read_first>
<action>
1. Create `src/lib/engine/storage.ts`
2. Next.js might break if `indexedDB` is accessed on the server. Wrap imports/executions to only evaluate when `typeof window !== 'undefined'`.
3. Install `idb` via `npm install idb` if necessary (modify package.json if it isn't listed, or just assume the executor runs it).
4. Export `initDB()`: Uses `idb.openDB('logic-looper-db', 1, { upgrade(db) { db.createObjectStore('daily-state'); }})`.
5. Export `saveDailyState<T>(dateStr: string, state: GameState<T>): Promise<void>` utilizing `tx.objectStore('daily-state').put(state, dateStr)`.
6. Export `getDailyState<T>(dateStr: string): Promise<GameState<T> | undefined>`.
</action>
<acceptance_criteria>
- `src/lib/engine/storage.ts` exposes `saveDailyState` and `getDailyState`.
- `idb` usage is guarded with `typeof window !== 'undefined'` checks structurally.
</acceptance_criteria>
</task>

<task>
<id>4</id>
<title>Number Matrix Logic Implementation & Registry</title>
<description>
Generate the first puzzle type implemention to satisfy the engine, and then link it in a registry that the React hook can consume.
</description>
<read_first>
- `src/lib/engine/types.ts`
- `src/lib/engine/prng.ts`
</read_first>
<action>
1. Create `src/lib/engine/puzzles/number-matrix.ts`.
2. Implement `NumberMatrixData` interface (e.g., `{ grid: (number | null)[][] }`).
3. Implement `numberMatrixEngine` object honoring `PuzzleEngine<NumberMatrixData>`. The `generate` function should build a minimal predictable 3x3 grid populated utilizing the provided PRNG float sequence. The `validate` should assert the grid has no nulls and valid conditions (pseudo-sudoku).
4. Create `src/lib/engine/registry.ts`.
5. Export `puzzleRegistry` mapping `PuzzleType.NUMBER_MATRIX` to `numberMatrixEngine`. Add mock/dummy engines for the remaining 4 types requested by MCH-04 to immediately satisfy typings and the architectural path.
6. Export a simple utility `getDailyPuzzleType(dateStr: string): PuzzleType` mapping days linearly or via hash modulo 5 to sequentially yield puzzles.
</action>
<acceptance_criteria>
- `src/lib/engine/puzzles/number-matrix.ts` implements a 3x3 mock validation grid logic based on PRNG sequences.
- `src/lib/engine/registry.ts` exposes `puzzleRegistry` connecting all 5 puzzle types.
</acceptance_criteria>
</task>

<task>
<id>5</id>
<title>State Management React Hook (useDailyPuzzle)</title>
<description>
A robust React architecture connection linking the pure deterministic engine to Next.js Client Components smoothly.
</description>
<read_first>
- `src/lib/engine/types.ts`
- `src/lib/engine/registry.ts`
- `src/lib/engine/storage.ts`
</read_first>
<action>
1. Create `src/hooks/useDailyPuzzle.ts`.
2. Build a custom React hook `useDailyPuzzle(dateString: string)` containing React context/state to manage UI renders.
3. On mount `useEffect`: 
   - Load `getDailyState` from indexedDB for the specific date.
   - If it exists, set `gameState`.
   - If it does not exist: Compute the `prng` seed, generate fresh engine data through the `puzzleRegistry`, generate a normalized `GameState`, immediately save it to `saveDailyState` asynchronously, and set `gameState`.
4. Export a function `makeMove(moveData)` resulting in a mutation to the current `gameState.moves`, running the puzzle `validate` hook, updating `gameState.isSolved`, calling `saveDailyState` for persistence, and setting the React local state for UI reactive updates.
</action>
<acceptance_criteria>
- `src/hooks/useDailyPuzzle.ts` has proper Typescript implementation correctly orchestrating all previous offline-engine layers into generic React state, returning `gameState`, `isLoading`, and `makeMove`.
</acceptance_criteria>
</task>

## Verification
- Validate the PRNG outputs identically provided string seeds.
- Confirm `storage.ts` contains window checks so Next.js doesn't crash during SSR evaluation.
- All Typescript files must compile cleanly using strict types locally, asserting interfaces hold up without `any` bypasses in core engine files.
