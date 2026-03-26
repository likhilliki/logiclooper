# Phase 1: offline-puzzle-engine - Validation Strategy

## 1. Unit & Edge Case Validation (Dimension 1 & 2)
*Validating the logical correctness of the determinism and IndexedDB logic.*
- **Expected Tests:** 
  - `prng.test.ts`: Verify identical seed strings produce identical numeric arrays continuously.
  - `storage.test.ts`: Mock `idb` and verify write/read cycles of the daily game state.
  - `puzzle-registry.test.ts`: Exert logic testing the registry selector.

## 2. Integration & Flow Validation (Dimension 3 & 5)
*Validating puzzle logic states transitions.*
- **Expected Tests:**
  - `gameplay.test.ts`: Instantiate a puzzle, simulate correct moves -> `.isSolved` is true. Simulate incorrect moves -> `.isSolved` is false.
  - Simulate refreshing the hook/page to verify state hydrates perfectly from the mocked indexedDB.

## 3. Automation Contract (Dimension 8)
- [ ] Core validation hooks are tested (100% logic coverage in engine).
- [ ] No database rounds or network payloads initiated inside the engine tests.
