import type { Stage } from "./types.js";

export const EXCLUDED_PATH_SEGMENTS = ["templates", "archive", "done"];
export const TRIGGER_COOLDOWN_HOURS = 6;
export const SOFT_RESTART_GAP_DAYS = 7;
export const SOFT_RESTART_SUPPRESSION_HOURS = 24;

export const STAGE_ASCENSION_DAYS: Record<Stage, number> = {
  Egg: 0,
  Baby: 3,
  Child: 10,
  Teen: 30,
  Adult: 90,
  Elder: 365
};

export const STREAK_MILESTONES = [7, 30, 100, 365] as const;
