import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { HistoryStore } from "../types.js";

const defaultHistory = (): HistoryStore => ({
  firstRunAt: null,
  lastRunAt: null,
  streakDays: 0,
  currentStage: "Egg",
  vacationMode: false,
  lastHunger: null,
  lastTriggerFiredAt: {},
  suppressNegativeUntil: null
});

export const loadHistory = async (historyPath: string): Promise<HistoryStore> => {
  try {
    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw) as HistoryStore;
    return { ...defaultHistory(), ...parsed };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultHistory();
    }

    const backupPath = `${historyPath}.bak.${Date.now()}`;
    try {
      await rename(historyPath, backupPath);
    } catch {
      // No backup if the file cannot be moved.
    }
    return defaultHistory();
  }
};

export const saveHistory = async (
  historyPath: string,
  history: HistoryStore
): Promise<void> => {
  await mkdir(dirname(historyPath), { recursive: true });
  await writeFile(historyPath, JSON.stringify(history, null, 2), "utf8");
};

