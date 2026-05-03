export type Stage = "Egg" | "Baby" | "Child" | "Teen" | "Adult" | "Elder";

export type TriggerType =
  | "hunger_high"
  | "hunger_critical"
  | "mood_dropped"
  | "energy_low"
  | "streak_at_risk"
  | "streak_broken"
  | "stage_advanced"
  | "milestone_streak";

export interface TriggerEvent {
  type: TriggerType;
  occurredAt: string;
  metadata?: Record<string, number | string | boolean>;
}

export interface TamaState {
  hunger: number;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: number;
  streakDays: number;
  stage: Stage;
  openItems: number;
  hoursSinceCapture: number;
  capturesLast7d: number;
  closesLast7d: number;
  lastCaptureAt: string | null;
  vacationMode: boolean;
  activeTriggers: TriggerEvent[];
}

export interface VaultStats {
  capturesToday: number;
  capturesLast7d: number;
  closesToday: number;
  closesLast7d: number;
  openItems: number;
  lastCaptureAt: string | null;
  excludedPaths: string[];
}

export interface HistoryStore {
  firstRunAt: string | null;
  lastRunAt: string | null;
  streakDays: number;
  currentStage: Stage;
  vacationMode: boolean;
  lastHunger: number | null;
  lastTriggerFiredAt: Partial<Record<TriggerType, string>>;
  suppressNegativeUntil: string | null;
}

export interface EngineInput {
  vaultPath: string;
  historyPath: string;
  now: Date;
  watch?: boolean;
  quiet?: boolean;
}

