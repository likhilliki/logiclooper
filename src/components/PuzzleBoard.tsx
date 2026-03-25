"use client";

import { useState, useEffect, useCallback } from "react";
import { Puzzle, validateSolution } from "@/lib/puzzles/engine";
import { useAppDispatch } from "@/lib/store";
import { solvePuzzle, useHint } from "@/lib/store";
import { saveProgress, getProgress } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Star, RotateCcw, HelpCircle, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppSelector } from "@/lib/store";
import axios from "axios";

export default function PuzzleBoard({ puzzle }: { puzzle: Puzzle }) {
  const { status } = useSession();
  const dispatch = useAppDispatch();
  const puzzleDate = puzzle.date;
  const hintsUsedToday = useAppSelector((state) => state.game.hintsUsed[puzzleDate] || 0);
  const MAX_HINTS = 3;

  const [stars, setStars] = useState<{row: number, col: number}[]>([]);
  const [matrixState, setMatrixState] = useState<number[][]>([]);
  const [binaryGuess, setBinaryGuess] = useState<string>("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeTaken, setTimeTaken] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Load progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      // Reset states when puzzle changes
      setFeedback(null);
      setTimeTaken(0);
      setShowResults(false);
      setShowHint(false);
      setStartTime(Date.now());
      setStars([]);
      setMatrixState([]);
      setBinaryGuess("");
      setSequenceGuess("");
      setPatternGuess("");

      const progress = await getProgress(puzzleDate);
      if (progress) {
        if (progress.boardState) {
          if (puzzle.type === "DEDUCTION_GRID") setStars(progress.boardState);
          if (puzzle.type === "NUMBER_MATRIX") setMatrixState(progress.boardState);
          if (puzzle.type === "BINARY_LOGIC") setBinaryGuess(progress.boardState);
          if (puzzle.type === "SEQUENCE_SOLVER") setSequenceGuess(progress.boardState);
          if (puzzle.type === "PATTERN_MATCH") setPatternGuess(progress.boardState);
        }
        if (progress.solved) {
          setFeedback("correct");
          setTimeTaken(progress.timeTaken);
          setShowResults(true);
        }
        if (progress.hintsUsed > 0) setShowHint(true);
      } else if (puzzle.type === "NUMBER_MATRIX") {
        setMatrixState(puzzle.data.grid);
      }
    };
    loadProgress();
  }, [puzzleDate, puzzle]);

  const [sequenceGuess, setSequenceGuess] = useState("");
  const [patternGuess, setPatternGuess] = useState("");

  const handleCheck = useCallback(async () => {
    let isCorrect = false;
    if (puzzle.type === "DEDUCTION_GRID") {
      isCorrect = validateSolution(puzzle, stars);
    } else if (puzzle.type === "NUMBER_MATRIX") {
      // Check if all cells are filled and valid Sudoku-lite rules apply
      const size = 4;
      const isValid = (grid: number[][]) => {
        for (let i = 0; i < size; i++) {
          const rowSet = new Set();
          const colSet = new Set();
          for (let j = 0; j < size; j++) {
            if (grid[i][j] < 1 || grid[i][j] > 4 || grid[j][i] < 1 || grid[j][i] > 4) return false;
            rowSet.add(grid[i][j]);
            colSet.add(grid[j][i]);
          }
          if (rowSet.size !== size || colSet.size !== size) return false;
        }
        // Check 2x2 subgrids
        for (let r = 0; r < size; r += 2) {
          for (let c = 0; c < size; c += 2) {
            const subgridSet = new Set();
            for (let i = 0; i < 2; i++) {
              for (let j = 0; j < 2; j++) {
                subgridSet.add(grid[r + i][c + j]);
              }
            }
            if (subgridSet.size !== 4) return false;
          }
        }
        return true;
      };
      isCorrect = isValid(matrixState);
    } else if (puzzle.type === "BINARY_LOGIC") {
      isCorrect = binaryGuess === puzzle.solution;
    } else if (puzzle.type === "SEQUENCE_SOLVER") {
      isCorrect = sequenceGuess.trim() === puzzle.solution.toString().trim();
    } else if (puzzle.type === "PATTERN_MATCH") {
      isCorrect = patternGuess === puzzle.solution;
    }

    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      const finalTimeTaken = Math.floor((Date.now() - startTime) / 1000);
      setTimeTaken(finalTimeTaken);
      setShowResults(true);
      dispatch(solvePuzzle({ date: puzzleDate, points: puzzle.difficulty * 100, puzzleId: puzzle.id, timeTaken: finalTimeTaken }));
      const currentProgress = await getProgress(puzzleDate);
      const boardState = puzzle.type === "DEDUCTION_GRID" ? stars : 
                        puzzle.type === "NUMBER_MATRIX" ? matrixState : 
                        puzzle.type === "BINARY_LOGIC" ? binaryGuess :
                        puzzle.type === "SEQUENCE_SOLVER" ? sequenceGuess : patternGuess;
      
      await saveProgress({
        id: puzzleDate,
        solved: true,
        score: puzzle.difficulty * 100,
        timeTaken: finalTimeTaken,
        hintsUsed: currentProgress?.hintsUsed || 0,
        boardState,
      });

      // Automatically sync to server if authenticated
      if (status === "authenticated") {
        try {
          await axios.post("/api/scores", {
            score: puzzle.difficulty * 100,
            timeTaken: finalTimeTaken,
            puzzleId: puzzle.id,
            date: puzzleDate
          });
          // Dispatch custom event to refresh leaderboard in Dashboard
          window.dispatchEvent(new Event("refresh-dashboard"));
        } catch (e) {
          console.error("Auto-sync failed, queued for later", e);
        }
      }
    }
    setTimeout(() => setFeedback(null), 3000);
  }, [puzzle, stars, matrixState, binaryGuess, sequenceGuess, patternGuess, dispatch, puzzleDate, startTime]);

  const toggleStar = async (row: number, col: number) => {
    if (feedback === "correct" || puzzle.type !== "DEDUCTION_GRID") return;
    
    // Play subtle click sound (simulated with visual feedback)
    const newStars = [...stars];
    const index = newStars.findIndex(s => s.row === row && s.col === col);
    if (index !== -1) newStars.splice(index, 1);
    else if (newStars.length < puzzle.data.size) newStars.push({ row, col });
    else return;
    setStars(newStars);
    saveToIDB(newStars);
  };

  const updateMatrix = async (row: number, col: number, val: string) => {
    if (feedback === "correct" || puzzle.type !== "NUMBER_MATRIX") return;
    
    let num = parseInt(val);
    if (val === "") num = 0; // Allow clearing
    if (isNaN(num) && val !== "") return;
    if (num < 0 || num > 4) return;

    const newMatrix = [...matrixState];
    newMatrix[row] = [...newMatrix[row]];
    newMatrix[row][col] = num;
    setMatrixState(newMatrix);
    saveToIDB(newMatrix);
  };

  const saveToIDB = async (state: any) => {
    const currentProgress = await getProgress(puzzleDate);
    await saveProgress({
      id: puzzleDate,
      solved: currentProgress?.solved || false,
      score: currentProgress?.score || 0,
      timeTaken: currentProgress?.timeTaken || 0,
      hintsUsed: currentProgress?.hintsUsed || 0,
      boardState: state,
    });
  };

  const handleUseHint = async () => {
    if (hintsUsedToday >= MAX_HINTS || showHint) return;
    
    dispatch(useHint({ date: puzzleDate }));
    setShowHint(true);
    
    // Persist hint usage to IDB
    const currentProgress = await getProgress(puzzleDate);
    await saveProgress({
      id: puzzleDate,
      solved: currentProgress?.solved || false,
      score: currentProgress?.score || 0,
      timeTaken: currentProgress?.timeTaken || 0,
      hintsUsed: (currentProgress?.hintsUsed || 0) + 1,
      boardState: currentProgress?.boardState || (puzzle.type === "DEDUCTION_GRID" ? stars : puzzle.type === "NUMBER_MATRIX" ? matrixState : puzzle.type === "BINARY_LOGIC" ? binaryGuess : puzzle.type === "SEQUENCE_SOLVER" ? sequenceGuess : patternGuess),
    });
  };

  const handleResetProgress = async () => {
    await saveProgress({
      id: puzzleDate,
      solved: false,
      score: 0,
      timeTaken: 0,
      hintsUsed: 0,
      boardState: puzzle.type === "NUMBER_MATRIX" ? puzzle.data.grid : null
    });
    // Reload local state
    setFeedback(null);
    setTimeTaken(0);
    setShowResults(false);
    setShowHint(false);
    setStars([]);
    setMatrixState(puzzle.type === "NUMBER_MATRIX" ? puzzle.data.grid : []);
    setBinaryGuess("");
    setSequenceGuess("");
    setPatternGuess("");
    setStartTime(Date.now());
  };

  if (showResults) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-white p-8 rounded-[2.5rem] border-4 border-primary shadow-2xl shadow-primary/20 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-primary" />
        </div>
        <div>
          <h3 className="text-3xl font-black text-deep">Loop Completed!</h3>
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs mt-1">Daily Challenge Cleared</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="bg-background p-4 rounded-2xl border border-light-blue">
            <div className="text-2xl font-black text-primary">{puzzle.difficulty * 100}</div>
            <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">Points Earned</div>
          </div>
          <div className="bg-background p-4 rounded-2xl border border-light-blue">
            <div className="text-2xl font-black text-primary">{timeTaken}s</div>
            <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">Time Taken</div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => {
              const url = window.location.origin;
              const text = `I solved today's Logic Looper in ${timeTaken}s! Can you beat me? ${url}?date=${puzzleDate}`;
              if (navigator.share) {
                navigator.share({ title: 'Logic Looper', text, url: `${url}?date=${puzzleDate}` });
              } else {
                navigator.clipboard.writeText(text);
                alert("Result copied to clipboard!");
              }
            }}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            Share Result
          </button>
          
          <div className="w-full">
            {status === "authenticated" ? (
              <button 
                onClick={() => setShowResults(false)}
                className="w-full py-3 bg-light-blue/20 text-deep rounded-xl text-[10px] font-black uppercase tracking-widest border border-light-blue hover:bg-light-blue/30 transition-all"
              >
                View Board
              </button>
            ) : (
              <button 
                onClick={handleResetProgress}
                className="w-full py-3 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest border border-accent/20 hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={12} />
                Replay
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="bg-white border-b border-light-blue pb-4">
        <div className="flex items-center gap-2 mb-2 text-deep font-bold uppercase tracking-wider text-xs">
          <HelpCircle size={14} />
          {puzzle.type.replace("_", " ")}
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{puzzle.instructions}</p>
      </div>

      <div className="relative w-full bg-white border-2 border-deep rounded-2xl overflow-hidden shadow-2xl p-4 min-h-[300px] flex items-center justify-center">
        {puzzle.type === "DEDUCTION_GRID" && (
          <div className="grid h-full w-full gap-1" style={{ gridTemplateColumns: `repeat(${puzzle.data.size}, 1fr)` }}>
            {Array.from({ length: puzzle.data.size * puzzle.data.size }).map((_, i) => {
              const r = Math.floor(i / puzzle.data.size), c = i % puzzle.data.size;
              const hasStar = stars.some(s => s.row === r && s.col === c);
              return (
                <button key={i} onClick={() => toggleStar(r, c)} className="aspect-square border-[0.5px] border-light-blue flex items-center justify-center hover:bg-light-blue/10 transition-colors">
                  {hasStar && <Star className="text-primary fill-primary animate-in zoom-in duration-200" size={24} />}
                </button>
              );
            })}
          </div>
        )}

        {puzzle.type === "NUMBER_MATRIX" && matrixState.length > 0 && (
          <div className="grid grid-cols-4 gap-2 w-full">
            {matrixState.map((row, r) => row.map((val, c) => (
              <input
                key={`${r}-${c}`}
                type="number"
                value={val === 0 ? "" : val}
                onChange={(e) => updateMatrix(r, c, e.target.value)}
                disabled={puzzle.data.grid[r][c] !== 0}
                className={`w-full aspect-square text-center font-black text-xl rounded-lg border transition-all ${puzzle.data.grid[r][c] !== 0 ? 'bg-light-blue/20 text-deep/40' : 'bg-white border-primary text-primary focus:ring-2 focus:ring-primary/20 outline-none'}`}
              />
            )))}
          </div>
        )}

        {puzzle.type === "BINARY_LOGIC" && (
          <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-2xl border border-light-blue shadow-inner w-full">
              <div className="flex gap-8 text-2xl font-black">
                <div className="flex flex-col items-center"><span className="text-[10px] uppercase text-foreground/40 mb-1 tracking-widest">A</span>{puzzle.data.a}</div>
                <div className="flex flex-col items-center"><span className="text-[10px] uppercase text-foreground/40 mb-1 tracking-widest">Gate 1</span><span className="text-primary">{puzzle.data.gate1}</span></div>
                <div className="flex flex-col items-center"><span className="text-[10px] uppercase text-foreground/40 mb-1 tracking-widest">B</span>{puzzle.data.b}</div>
              </div>
              <div className="w-px h-6 bg-light-blue relative">
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex gap-8 text-2xl font-black">
                <div className="flex flex-col items-center"><span className="text-[10px] uppercase text-foreground/40 mb-1 tracking-widest">Result 1</span><span className="text-primary opacity-20">?</span></div>
                <div className="flex flex-col items-center"><span className="text-[10px] uppercase text-foreground/40 mb-1 tracking-widest">Gate 2</span><span className="text-accent">{puzzle.data.gate2}</span></div>
                <div className="flex flex-col items-center"><span className="text-[10px] uppercase text-foreground/40 mb-1 tracking-widest">C</span>{puzzle.data.c}</div>
              </div>
            </div>
            <div className="flex gap-6">
              {["0", "1"].map(val => (
                <button
                  key={val}
                  onClick={() => { setBinaryGuess(val); saveToIDB(val); }}
                  className={`w-20 h-20 rounded-3xl font-black text-3xl border-2 transition-all shadow-lg ${binaryGuess === val ? 'bg-primary text-white border-primary shadow-primary/20 scale-105' : 'border-light-blue text-deep bg-white hover:border-primary/50'}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        {puzzle.type === "SEQUENCE_SOLVER" && (
          <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="flex flex-wrap justify-center gap-3 text-2xl font-black">
              {puzzle.data.sequence.map((num: number, i: number) => (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-light-blue shadow-sm text-deep"
                >
                  {num}
                </motion.div>
              ))}
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-dashed border-primary text-primary animate-pulse">?</div>
            </div>
            
            <div className="w-full max-w-[280px] space-y-4">
              <input
                type="number"
                inputMode="numeric"
                value={sequenceGuess}
                onChange={(e) => { setSequenceGuess(e.target.value); saveToIDB(e.target.value); }}
                placeholder="Next number..."
                className="w-full text-center py-5 bg-white border-2 border-light-blue rounded-[2rem] text-3xl font-black focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-xl text-primary"
              />
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      const newVal = sequenceGuess + n;
                      setSequenceGuess(newVal);
                      saveToIDB(newVal);
                    }}
                    className="py-3 bg-white border border-light-blue rounded-xl font-black text-lg hover:border-primary transition-colors active:scale-95"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const newVal = sequenceGuess.slice(0, -1);
                    setSequenceGuess(newVal);
                    saveToIDB(newVal);
                  }}
                  className="col-span-2 py-3 bg-accent/5 text-accent border border-accent/20 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {puzzle.type === "PATTERN_MATCH" && (
          <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="grid grid-cols-2 gap-4">
              {/* Original Grid */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-foreground/40 tracking-widest">Original</span>
                <div className="grid grid-cols-2 gap-1 p-2 bg-background rounded-xl border border-light-blue shadow-inner">
                  {puzzle.data.grid.flat().map((shape: string, i: number) => (
                    <div key={i} className="w-10 h-10 flex items-center justify-center text-2xl">{shape}</div>
                  ))}
                </div>
              </div>
              {/* Transformed Grid */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-foreground/40 tracking-widest">Transformation</span>
                <div className="grid grid-cols-2 gap-1 p-2 bg-background rounded-xl border border-light-blue shadow-inner">
                  {puzzle.data.rotated.map((shape: string, i: number) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center text-2xl ${shape === "❓" ? "text-primary animate-pulse" : ""}`}>
                      {shape === "❓" && patternGuess ? patternGuess : shape}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {["▲", "■", "●", "◆", "★", "✖"].map(shape => (
                <button
                  key={shape}
                  onClick={() => { setPatternGuess(shape); saveToIDB(shape); }}
                  className={`w-12 h-12 rounded-xl text-xl border-2 transition-all shadow-md ${patternGuess === shape ? 'bg-primary text-white border-primary shadow-primary/20 scale-105' : 'border-light-blue text-deep bg-white hover:border-primary/50'}`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 flex items-center justify-center backdrop-blur-[2px] z-10 ${feedback === "correct" ? "bg-primary/10" : "bg-accent/10"}`}>
              <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className={`p-8 rounded-[2.5rem] bg-white border-4 shadow-2xl ${feedback === "correct" ? "border-primary" : "border-accent"}`}>
                {feedback === "correct" ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-primary" size={64} />
                    <span className="font-black text-primary uppercase tracking-tighter">Solved!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="text-accent" size={64} />
                    <span className="font-black text-accent uppercase tracking-tighter">Try Again</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4">
        <button 
          onClick={handleCheck} 
          disabled={feedback === "correct"} 
          className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
        >
          Check Solution
        </button>
        <button 
          onClick={handleUseHint} 
          disabled={hintsUsedToday >= MAX_HINTS || showHint || feedback === "correct"} 
          className="flex items-center justify-center gap-2 text-primary font-bold text-sm hover:text-deep transition-colors disabled:opacity-30"
        >
          <Lightbulb size={16} />
          {showHint ? <span className="italic text-foreground/60">{puzzle.hint}</span> : <span>Need a hint? ({MAX_HINTS - hintsUsedToday} left)</span>}
        </button>
      </div>
    </div>
  );
}
