export enum PuzzleType {
  NUMBER_MATRIX = 'NUMBER_MATRIX',
  PATTERN = 'PATTERN',
  SEQUENCE = 'SEQUENCE',
  DEDUCTION = 'DEDUCTION',
  BINARY = 'BINARY'
}

/**
 * State of any puzzle across dates.
 */
export interface GameState<T> {
  date: string;
  type: PuzzleType;
  puzzleData: T;
  moves: any[];
  isSolved: boolean;
  startTime: number;
  lastUpdated: number;
  hintsUsed: number;
}

/**
 * Common Engine Interface
 */
export interface PuzzleEngine<T> {
  /**
   * Generates the puzzle's initial solved configuration and current play state.
   */
  generate(prng: () => number): T;

  /**
   * Validates if the puzzle's current state confirms a complete solve.
   */
  validate(currentState: T): boolean;
}
