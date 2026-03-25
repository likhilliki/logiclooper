import CryptoJS from "crypto-js";

export type PuzzleType = "DEDUCTION_GRID" | "NUMBER_MATRIX" | "PATTERN_MATCH" | "SEQUENCE_SOLVER" | "BINARY_LOGIC";

export interface Puzzle {
  id: string;
  type: PuzzleType;
  difficulty: number;
  data: any;
  solution: any;
  hint: string;
  instructions: string;
  date: string;
}

class SeededRandom {
  private seed: string;
  constructor(seed: string) { this.seed = seed; }
  next(): number {
    const hash = CryptoJS.SHA256(this.seed).toString();
    this.seed = hash;
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * GENERATOR: NUMBER MATRIX (Sudoku-lite 4x4)
 */
const generateNumberMatrix = (rng: SeededRandom): Puzzle => {
  const baseGrid = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 3, 4, 1],
    [4, 1, 2, 3]
  ];
  
  // More robust shuffle: swap rows within blocks, swap columns within blocks
  const grid = JSON.parse(JSON.stringify(baseGrid));
  if (rng.next() > 0.5) [grid[0], grid[1]] = [grid[1], grid[0]];
  if (rng.next() > 0.5) [grid[2], grid[3]] = [grid[3], grid[2]];
  
  const solution = JSON.parse(JSON.stringify(grid));
  const puzzleGrid = JSON.parse(JSON.stringify(grid));
  const cells = [];
  for(let r=0; r<4; r++) for(let c=0; c<4; c++) cells.push({r, c});
  rng.shuffle(cells);
  
  // Remove 8-9 numbers for medium difficulty
  const toRemove = rng.nextInt(8, 9);
  for (let i = 0; i < toRemove; i++) {
    puzzleGrid[cells[i].r][cells[i].c] = 0;
  }

  return {
    id: `matrix-${Date.now()}`,
    type: "NUMBER_MATRIX",
    difficulty: 2,
    data: { grid: puzzleGrid },
    solution: solution,
    instructions: "Fill the 4x4 grid. Each row, column, and 2x2 corner box must contain digits 1-4.",
    hint: "Start with the 2x2 boxes that are almost full.",
    date: ""
  };
};

/**
 * GENERATOR: BINARY LOGIC (Circuit-based)
 */
const generateBinaryLogic = (rng: SeededRandom): Puzzle => {
  const a = rng.nextInt(0, 1);
  const b = rng.nextInt(0, 1);
  const c = rng.nextInt(0, 1);
  
  const gate1 = rng.next() > 0.5 ? "AND" : "OR";
  const gate2 = rng.next() > 0.5 ? "XOR" : "NAND";
  
  const out1 = gate1 === "AND" ? (a && b) : (a || b);
  let solution: number;
  
  if (gate2 === "XOR") solution = out1 ^ c;
  else solution = !(out1 && c) ? 1 : 0;

  return {
    id: `binary-${Date.now()}`,
    type: "BINARY_LOGIC",
    difficulty: 2,
    data: { a, b, c, gate1, gate2 },
    solution: solution.toString(),
    instructions: `Solve the logic circuit: (A ${gate1} B) ${gate2} C. Inputs: A=${a}, B=${b}, C=${c}.`,
    hint: "Calculate the first gate result, then use it as input for the second gate.",
    date: ""
  };
};

/**
 * GENERATOR: DEDUCTION GRID (LinkedIn-style "Queens" variant)
 */
const generateDeductionGrid = (rng: SeededRandom, size: number): Puzzle => {
  const solve = (row: number, currentSolution: number[]): number[] | null => {
    if (row === size) return currentSolution;
    const possibleCols = Array.from({ length: size }, (_, i) => i);
    rng.shuffle(possibleCols);
    for (const col of possibleCols) {
      let valid = true;
      for (let prevRow = 0; prevRow < row; prevRow++) {
        const prevCol = currentSolution[prevRow];
        if (prevCol === col || (Math.abs(prevRow - row) <= 1 && Math.abs(prevCol - col) <= 1)) {
          valid = false;
          break;
        }
      }
      if (valid) {
        const result = solve(row + 1, [...currentSolution, col]);
        if (result) return result;
      }
    }
    return null;
  };

  const solution = solve(0, []) || [0, 2, 4, 1, 3];
  return {
    id: `grid-${Date.now()}`,
    type: "DEDUCTION_GRID",
    difficulty: size - 3,
    data: { size },
    solution: solution,
    instructions: `Place exactly one star in every row and column. No two stars can touch each other, even diagonally.`,
    hint: `Start by looking at the corners or edges where constraints are highest.`,
    date: ""
  };
};

/**
 * GENERATOR: SEQUENCE SOLVER (Arithmetic, Geometric, Fibonacci)
 */
const generateSequenceSolver = (rng: SeededRandom): Puzzle => {
  const type = rng.nextInt(0, 2);
  let sequence: number[] = [];
  let solution: number = 0;
  let desc = "";

  if (type === 0) { // Arithmetic
    const start = rng.nextInt(1, 20);
    const diff = rng.nextInt(3, 12);
    sequence = [start, start + diff, start + diff * 2, start + diff * 3];
    solution = start + diff * 4;
    desc = "Arithmetic sequence";
  } else if (type === 1) { // Geometric
    const start = rng.nextInt(1, 5);
    const ratio = rng.nextInt(2, 3);
    sequence = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio];
    solution = start * ratio ** 4;
    desc = "Geometric sequence";
  } else { // Fibonacci-style
    const a = rng.nextInt(1, 10);
    const b = rng.nextInt(1, 10);
    sequence = [a, b, a + b, a + b + b];
    solution = (a + b) + (a + b + b);
    desc = "Summation sequence";
  }

  return {
    id: `seq-${Date.now()}`,
    type: "SEQUENCE_SOLVER",
    difficulty: 3,
    data: { sequence, desc },
    solution: solution.toString(),
    instructions: `Find the missing number in this ${desc}.`,
    hint: "Look at the relationship between consecutive numbers.",
    date: ""
  };
};

/**
 * GENERATOR: PATTERN MATCH (Grid patterns)
 */
const generatePatternMatch = (rng: SeededRandom): Puzzle => {
  const shapes = ["▲", "■", "●", "◆", "★", "✖"];
  rng.shuffle(shapes);
  
  // 2x2 Pattern
  const grid = [
    [shapes[0], shapes[1]],
    [shapes[2], shapes[3]]
  ];
  
  // Pattern: Rotate 90 deg clockwise
  const rotated = [
    [shapes[2], shapes[0]],
    [shapes[3], shapes[1]]
  ];

  return {
    id: `pat-${Date.now()}`,
    type: "PATTERN_MATCH",
    difficulty: 2,
    data: { grid, rotated: [rotated[0][0], rotated[0][1], rotated[1][0], "❓"] },
    solution: rotated[1][1],
    instructions: "The second grid is a transformation of the first. Identify the missing shape.",
    hint: "The grid has been rotated 90 degrees clockwise.",
    date: ""
  };
};

export const getDailyPuzzle = (date: string): Puzzle => {
  // Use UTC date string for consistent global puzzle rotation
  const utcDate = new Date(date).toISOString().split("T")[0];
  const seed = CryptoJS.SHA256(utcDate).toString();
  const rng = new SeededRandom(seed);
  
  const types: PuzzleType[] = ["DEDUCTION_GRID", "NUMBER_MATRIX", "BINARY_LOGIC", "SEQUENCE_SOLVER", "PATTERN_MATCH"];
  // Deterministic type selection based on date
  const dayIndex = Math.floor(new Date(utcDate).getTime() / 86400000);
  const type = types[dayIndex % types.length];
  
  let puzzle: Puzzle;
  switch (type) {
    case "NUMBER_MATRIX": puzzle = generateNumberMatrix(rng); break;
    case "BINARY_LOGIC": puzzle = generateBinaryLogic(rng); break;
    case "SEQUENCE_SOLVER": puzzle = generateSequenceSolver(rng); break;
    case "PATTERN_MATCH": puzzle = generatePatternMatch(rng); break;
    default: puzzle = generateDeductionGrid(rng, 5); break;
  }
  
  return { ...puzzle, date: utcDate };
};

export const validateSolution = (puzzle: Puzzle, userStars: {row: number, col: number}[]): boolean => {
  const size = puzzle.data.size;
  if (userStars.length !== size) return false;
  
  const rows = new Set();
  const cols = new Set();
  
  for (const star of userStars) {
    if (rows.has(star.row) || cols.has(star.col)) return false;
    rows.add(star.row);
    cols.add(star.col);
  }
  
  // Check diagonal/touching
  for (let i = 0; i < userStars.length; i++) {
    for (let j = i + 1; j < userStars.length; j++) {
      const s1 = userStars[i];
      const s2 = userStars[j];
      // If stars touch (horizontally, vertically, or diagonally)
      if (Math.abs(s1.row - s2.row) <= 1 && Math.abs(s1.col - s2.col) <= 1) return false;
    }
  }
  
  return rows.size === size && cols.size === size;
};
