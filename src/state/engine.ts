import {
  SOFT_RESTART_GAP_DAYS,
  SOFT_RESTART_SUPPRESSION_HOURS,
  STREAK_MILESTONES,
  TRIGGER_COOLDOWN_HOURS
} from "../config.js";
import type {
  HistoryStore,
  Stage,
  TamaState,
  TriggerType,
  VaultStats
} from "../types.js";
import { calculateEnergy, calculateHunger, calculateMood, deriveStage } from "./formulas.js";

const hoursBetween = (from: string | Date | null, to: Date): number => {
  if (!from) return 0;
  const start = from instanceof Date ? from : new Date(from);
  return (to.getTime() - start.getTime()) / (1000 * 60 * 60);
};

const shouldFire = (
  history: HistoryStore,
  trigger: TriggerType,
  now: Date
): boolean => {
  const last = history.lastTriggerFiredAt[trigger];
  if (!last) return true;
  return hoursBetween(last, now) >= TRIGGER_COOLDOWN_HOURS;
};

export const deriveState = (
  stats: VaultStats,
  history: HistoryStore,
  now: Date
): { state: TamaState; nextHistory: HistoryStore } => {
  if (history.lastRunAt && new Date(history.lastRunAt) > now) {
    return {
      state: {
        hunger: 0,
        mood: 3,
        energy: 100,
        streakDays: history.streakDays,
        stage: history.currentStage,
        openItems: stats.openItems,
        hoursSinceCapture: 0,
        capturesLast7d: stats.capturesLast7d,
        closesLast7d: stats.closesLast7d,
        lastCaptureAt: stats.lastCaptureAt,
        vacationMode: history.vacationMode,
        activeTriggers: []
      },
      nextHistory: history
    };
  }

  const isFirstRun = history.firstRunAt === null;
  const gapDays = history.lastRunAt
    ? hoursBetween(history.lastRunAt, now) / 24
    : 0;
  const inSoftRestart = gapDays > SOFT_RESTART_GAP_DAYS;
  const inSuppressionWindow =
    history.suppressNegativeUntil !== null &&
    new Date(history.suppressNegativeUntil) > now;
  const hoursSinceCapture = hoursBetween(stats.lastCaptureAt, now);
  const hunger = history.vacationMode ? 0 : calculateHunger(hoursSinceCapture);
  const mood = history.vacationMode
    ? (Math.max(3, calculateMood(stats)) as 3 | 4 | 5)
    : calculateMood(stats);
  const energy = calculateEnergy(stats.openItems);

  let streakDays = history.streakDays;
  const activeDay = stats.capturesToday > 0 && stats.closesToday > 0;
  if (!history.vacationMode) {
    if (activeDay) streakDays += 1;
    else if (stats.capturesToday === 0 && stats.closesToday === 0 && !isFirstRun) streakDays = 0;
  }

  const stage = deriveStage(streakDays, energy, mood, history.currentStage);
  const activeTriggers: TamaState["activeTriggers"] = [];
  const maybeTrigger = (type: TriggerType, condition: boolean, metadata?: Record<string, number>) => {
    if (!condition) return;
    if (!shouldFire(history, type, now)) return;
    if (
      (inSoftRestart || inSuppressionWindow) &&
      (type === "hunger_high" || type === "hunger_critical" || type === "streak_broken")
    ) {
      return;
    }
    if (isFirstRun) return;
    activeTriggers.push({ type, occurredAt: now.toISOString(), metadata });
  };

  const previousHunger = history.lastHunger ?? 0;
  maybeTrigger("hunger_high", !history.vacationMode && hunger > 60 && previousHunger <= 60, {
    hunger
  });
  maybeTrigger(
    "hunger_critical",
    !history.vacationMode && hunger > 90 && previousHunger <= 90,
    { hunger }
  );
  maybeTrigger("energy_low", energy < 30, { energy, openItems: stats.openItems });
  maybeTrigger("mood_dropped", mood <= 2, { mood });

  const localHour = now.getUTCHours();
  maybeTrigger("streak_at_risk", !history.vacationMode && stats.capturesToday === 0 && localHour >= 20);
  maybeTrigger("streak_broken", !history.vacationMode && streakDays === 0 && history.streakDays > 0);
  maybeTrigger("stage_advanced", stage !== history.currentStage);
  maybeTrigger("milestone_streak", STREAK_MILESTONES.includes(streakDays as (typeof STREAK_MILESTONES)[number]));

  const lastTriggerFiredAt = { ...history.lastTriggerFiredAt };
  for (const trigger of activeTriggers) {
    lastTriggerFiredAt[trigger.type] = trigger.occurredAt;
  }

  const nextHistory: HistoryStore = {
    ...history,
    firstRunAt: history.firstRunAt ?? now.toISOString(),
    lastRunAt: now.toISOString(),
    streakDays,
    currentStage: stage as Stage,
    lastHunger: hunger,
    lastTriggerFiredAt,
    suppressNegativeUntil: inSoftRestart
      ? new Date(now.getTime() + SOFT_RESTART_SUPPRESSION_HOURS * 3600_000).toISOString()
      : history.suppressNegativeUntil
  };

  return {
    state: {
      hunger,
      mood,
      energy,
      streakDays,
      stage,
      openItems: stats.openItems,
      hoursSinceCapture: Math.max(0, Math.round(hoursSinceCapture)),
      capturesLast7d: stats.capturesLast7d,
      closesLast7d: stats.closesLast7d,
      lastCaptureAt: stats.lastCaptureAt,
      vacationMode: history.vacationMode,
      activeTriggers
    },
    nextHistory
  };
};

