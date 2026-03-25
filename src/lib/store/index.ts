import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

interface GameState {
  streak: number;
  totalPoints: number;
  lastPlayed: string | null;
  solvedPuzzles: Record<string, boolean>; // date -> solved
  hintsUsed: Record<string, number>; // date -> count
  syncQueue: Array<{ date: string; points: number; puzzleId: string; timeTaken: number }>;
}

const initialState: GameState = {
  streak: 0,
  totalPoints: 0,
  lastPlayed: null,
  solvedPuzzles: {},
  hintsUsed: {},
  syncQueue: [],
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    solvePuzzle: (state, action: PayloadAction<{ date: string; points: number; puzzleId: string; timeTaken: number }>) => {
      const { date, points, puzzleId, timeTaken } = action.payload;
      if (!state.solvedPuzzles[date]) {
        state.solvedPuzzles[date] = true;
        state.totalPoints += points;
        
        // Update streak logic
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        
        if (state.lastPlayed === yesterday) {
          state.streak += 1;
        } else if (state.lastPlayed !== today) {
          state.streak = 1;
        }
        state.lastPlayed = today;

        // Add to sync queue
        state.syncQueue.push({ date, points, puzzleId, timeTaken });
      }
    },
    useHint: (state, action: PayloadAction<{ date: string }>) => {
      const { date } = action.payload;
      state.hintsUsed[date] = (state.hintsUsed[date] || 0) + 1;
    },
    clearSyncQueue: (state) => {
      state.syncQueue = [];
    },
    loadState: (state, action: PayloadAction<Partial<GameState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { solvePuzzle, loadState, clearSyncQueue, useHint } = gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
