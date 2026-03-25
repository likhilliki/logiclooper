import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "logic_looper_db";
const DB_VERSION = 1;

interface UserProgress {
  id: string; // date string
  solved: boolean;
  score: number;
  timeTaken: number;
  hintsUsed: number;
  boardState: any; // Saved stars or puzzle-specific state
}

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("progress")) {
        db.createObjectStore("progress", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("user_stats")) {
        db.createObjectStore("user_stats", { keyPath: "id" });
      }
    },
  });
};

export const saveProgress = async (progress: UserProgress) => {
  const db = await initDB();
  await db.put("progress", progress);
};

export const getProgress = async (id: string): Promise<UserProgress | undefined> => {
  const db = await initDB();
  return db.get("progress", id);
};

export const getAllProgress = async (): Promise<UserProgress[]> => {
  const db = await initDB();
  return db.getAll("progress");
};
