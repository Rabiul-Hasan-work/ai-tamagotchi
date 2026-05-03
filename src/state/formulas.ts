import type { Stage, VaultStats } from "../types.js";

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

export const calculateHunger = (hoursSinceCapture: number): number =>
  clamp(Math.round(hoursSinceCapture * 4), 0, 100);

export const calculateMood = (stats: VaultStats): 1 | 2 | 3 | 4 | 5 => {
  if (stats.capturesLast7d === 0 && stats.openItems > 5) {
    return 2;
  }

  if (stats.openItems === 0) {
    return 5;
  }

  const ratio = stats.closesLast7d / Math.max(1, stats.openItems);
  if (ratio >= 1.0) return 5;
  if (ratio >= 0.7) return 4;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
};

export const calculateEnergy = (openItems: number): number => {
  const penalty = Math.max(0, openItems - 10) * 3;
  return clamp(100 - penalty, 0, 100);
};

export const deriveStage = (
  streakDays: number,
  energy: number,
  mood: number,
  currentStage: Stage
): Stage => {
  const stageOrder: Stage[] = ["Egg", "Baby", "Child", "Teen", "Adult", "Elder"];
  const currentIdx = stageOrder.indexOf(currentStage);

  let target: Stage = currentStage;
  if (streakDays >= 365) target = "Elder";
  else if (streakDays >= 90) target = "Adult";
  else if (streakDays >= 30 && mood >= 3) target = "Teen";
  else if (streakDays >= 10 && energy >= 40) target = "Child";
  else if (streakDays >= 3) target = "Baby";
  else target = "Egg";

  return stageOrder.indexOf(target) > currentIdx ? target : currentStage;
};

