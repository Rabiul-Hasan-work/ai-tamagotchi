import type { Stage, TamaState, TriggerType } from "../types.js";

const HEALTHY_BY_STAGE: Record<Stage, string[]> = {
  Egg: ["Still hatching... keep going."],
  Baby: ["Feed me ideas. I am hungry."],
  Child: ["What are we building today?"],
  Teen: ["Getting stronger. What is next on the list?"],
  Adult: ["Solid streak. Anything blocking you?"],
  Elder: ["We have been at this a while. What matters most today?"]
};

const PRIORITY: TriggerType[] = [
  "hunger_critical",
  "streak_at_risk",
  "streak_broken",
  "energy_low",
  "mood_dropped",
  "hunger_high",
  "stage_advanced",
  "milestone_streak"
];

export const pickRecommendation = (state: TamaState): string => {
  const trigger = PRIORITY.find((candidate) =>
    state.activeTriggers.some((evt) => evt.type === candidate)
  );

  switch (trigger) {
    case "hunger_critical":
      return `You have not captured anything in ${state.hoursSinceCapture}h. Drop a thought - anything.`;
    case "streak_at_risk":
      return "It is past 8pm and nothing captured today. Log one thing before midnight.";
    case "streak_broken":
      return "Streak reset. Start fresh - capture something small right now.";
    case "energy_low":
      return `You have ${state.openItems} open items dragging me down. Close one. Just one.`;
    case "mood_dropped":
      return "Close rate is low this week. Pick the easiest open task and finish it.";
    case "hunger_high":
      return `No capture in ${state.hoursSinceCapture}h. What are you working on?`;
    case "stage_advanced":
      return `We just hit ${state.stage}. Keep the momentum going.`;
    case "milestone_streak":
      return `${state.streakDays}-day streak. That is real. Do not break it tonight.`;
    default: {
      const pool = HEALTHY_BY_STAGE[state.stage];
      return pool[state.streakDays % pool.length];
    }
  }
};

