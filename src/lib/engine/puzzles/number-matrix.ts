import { PuzzleEngine } from '../types';

export interface NumberMatrixData {
  config: number[][];   // The solved solution or puzzle configuration
  grid: (number | null)[][]; // The user's current working grid
  size: number;
}

export const numberMatrixEngine: PuzzleEngine<NumberMatrixData> = {
  generate(prng: () => number): NumberMatrixData {
    const size = 3;
    const config = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ];
    
    // Very rudimentary random masking to prove engine logic
    const grid: (number | null)[][] = [];

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        // use seeded PRNG effectively
        const rm = prng();
        if (rm > 0.5) {
          row.push(null);
        } else {
          row.push(config[r][c]);
        }
      }
      grid.push(row);
    }

    // Always reveal 1,1 at minimum to ensure it's not totally blank if we're unlucky
    const someReveal = prng();
    grid[Math.floor(someReveal * 3)][Math.floor(someReveal * 3)] = config[Math.floor(someReveal * 3)][Math.floor(someReveal * 3)];

    return { size, config, grid };
  },

  validate(currentState: NumberMatrixData): boolean {
    const { grid, size } = currentState;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Correctness check inside pseudo-matrix logic (1-9 sum, unique etc)
        // Here we just demand the user filled it fully with numbers that match
        if (grid[r][c] === null) {
          return false;
        }
        
        // Wait, where do we keep the configuration to check against?
        // We actually shouldn't just check against 'config' natively, the player resolves it.
        // For Sudoku variation: numbers 1-9 without duplicates in the 3x3
        // Mock check for now: 
      }
    }

    // Validate 1-9 uniqueness in 3x3
    const numbers = new Set();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (typeof val === 'number') {
          if (val < 1 || val > 9) return false;
          numbers.add(val);
        }
      }
    }

    return numbers.size === 9;
  }
};
