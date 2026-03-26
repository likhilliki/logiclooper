'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameState, PuzzleType } from '../lib/engine/types';
import { getDatePRNG } from '../lib/engine/prng';
import { getDailyState, saveDailyState } from '../lib/engine/storage';
import { getDailyPuzzleType, puzzleRegistry } from '../lib/engine/registry';

/**
 * useDailyPuzzle - Orchestrates the offline engine and persistence.
 * @param dateStr Format: 'YYYY-MM-DD'
 */
export function useDailyPuzzle<T>(dateStr: string) {
  const [gameState, setGameState] = useState<GameState<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPuzzle() {
      try {
        setIsLoading(true);
        // 1. Check persistence
        let state = await getDailyState<T>(dateStr);

        if (!state) {
          // 2. Generate if fresh day
          const type = getDailyPuzzleType(dateStr);
          const prng = getDatePRNG(dateStr);
          const engine = puzzleRegistry[type];
          
          if (!engine) throw new Error(`Engine not found for type: ${type}`);

          const puzzleData = engine.generate(prng);
          
          state = {
            date: dateStr,
            type,
            puzzleData,
            moves: [],
            isSolved: false,
            startTime: Date.now(),
            lastUpdated: Date.now(),
            hintsUsed: 0
          };

          await saveDailyState(dateStr, state);
        }

        if (isMounted) {
          setGameState(state);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error loading puzzle');
          setIsLoading(false);
        }
      }
    }

    loadPuzzle();

    return () => {
      isMounted = false;
    };
  }, [dateStr]);

  /**
   * makeMove - Allows the UI to update the puzzle state and persist it.
   * Note: Optimization could involve throttling the disk write.
   */
  const makeMove = useCallback(async (updatedPuzzleData: T) => {
    if (!gameState) return;

    const type = gameState.type;
    const engine = puzzleRegistry[type];
    const isSolved = engine.validate(updatedPuzzleData);

    const newState: GameState<T> = {
      ...gameState,
      puzzleData: updatedPuzzleData,
      isSolved,
      lastUpdated: Date.now(),
      moves: [...gameState.moves, { t: Date.now(), data: updatedPuzzleData }] // Basic move logging
    };

    setGameState(newState);
    await saveDailyState(dateStr, newState);
  }, [gameState, dateStr]);

  return {
    gameState,
    isLoading,
    error,
    makeMove
  };
}
