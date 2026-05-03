import type { Stage } from "../types.js";

export type MoodVariant = "happy" | "neutral" | "sad";

const STAGE_ASCII: Record<Stage, Record<MoodVariant, string>> = {
  Egg: { happy: "( ^_^ )", neutral: "(  o  )", sad: "(  ;_; )" },
  Baby: { happy: "(=^.^=)", neutral: "(=._.=)", sad: "(=;_;=)" },
  Child: { happy: "(^o^)/", neutral: "(-_-)", sad: "(T_T)" },
  Teen: { happy: "(>_<)o", neutral: "(-.-)", sad: "(;_;)" },
  Adult: { happy: "(B-)", neutral: "(._.)", sad: "(>_<)" },
  Elder: { happy: "(^_^)", neutral: "(_.-)", sad: "(;_;)" }
};

export const toMoodVariant = (mood: number): MoodVariant => {
  if (mood >= 4) return "happy";
  if (mood <= 2) return "sad";
  return "neutral";
};

export const selectAscii = (stage: Stage, mood: number): string =>
  STAGE_ASCII[stage][toMoodVariant(mood)];

