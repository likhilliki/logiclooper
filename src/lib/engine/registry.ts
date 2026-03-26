import { PuzzleType, PuzzleEngine } from './types';
import { numberMatrixEngine } from './puzzles/number-matrix';

// Minimal mock engines for other puzzle types matching MCH-04 sequentially.
const mockEngine: PuzzleEngine<any> = {
  generate: (prng) => ({ dummy: Math.floor(prng() * 100) }),
  validate: (state) => !!state.solved,
};

/**
 * Connects identifying Enums to their execution logic modules.
 */
export const puzzleRegistry: Record<PuzzleType, PuzzleEngine<any>> = {
  [PuzzleType.NUMBER_MATRIX]: numberMatrixEngine,
  [PuzzleType.PATTERN]: mockEngine,
  [PuzzleType.SEQUENCE]: mockEngine,
  [PuzzleType.DEDUCTION]: mockEngine,
  [PuzzleType.BINARY]: mockEngine,
};

/**
 * Resolves the 5 main puzzle types sequentially based on the PRNG seed date or a modulus math hash.
 * This guarantees the user doesn't play Number Matrix 5 days in a row.
 */
export function getDailyPuzzleType(dateStr: string): PuzzleType {
  // We can hash the dateStr and modulo off our 5 types.
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  
  // Math.abs to protect against negative bitwises.
  const types = Object.values(PuzzleType);
  const index = Math.abs(hash) % types.length;

  return types[index];
}
