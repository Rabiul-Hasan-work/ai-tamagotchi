import type { HistoryStore, VaultStats } from "../src/types.js";

const nowIso = "2026-05-03T12:00:00.000Z";

export interface EngineFixture {
  name: string;
  stats: VaultStats;
  history: HistoryStore;
  now: Date;
  expected: {
    hunger: number;
    mood: 1 | 2 | 3 | 4 | 5;
    energy: number;
    streakDays: number;
    stage: "Egg" | "Baby" | "Child" | "Teen" | "Adult" | "Elder";
    triggers: string[];
    recommendation: string;
    ascii: string;
  };
}

const excludedPaths = ["templates", "archive", "done"];

export const fixtures: EngineFixture[] = [
  {
    name: "fresh_install",
    now: new Date(nowIso),
    stats: {
      capturesToday: 0,
      capturesLast7d: 0,
      closesToday: 0,
      closesLast7d: 0,
      openItems: 0,
      lastCaptureAt: null,
      excludedPaths
    },
    history: {
      firstRunAt: null,
      lastRunAt: null,
      streakDays: 0,
      currentStage: "Egg",
      vacationMode: false,
      lastHunger: null,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 0,
      mood: 5,
      energy: 100,
      streakDays: 0,
      stage: "Egg",
      triggers: [],
      recommendation: "Still hatching... keep going.",
      ascii: "( ^_^ )"
    }
  },
  {
    name: "neglected_3_days",
    now: new Date("2026-05-03T10:00:00.000Z"),
    stats: {
      capturesToday: 0,
      capturesLast7d: 1,
      closesToday: 0,
      closesLast7d: 0,
      openItems: 8,
      lastCaptureAt: "2026-04-30T10:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-04-01T00:00:00.000Z",
      lastRunAt: "2026-05-03T08:00:00.000Z",
      streakDays: 5,
      currentStage: "Baby",
      vacationMode: false,
      lastHunger: 40,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 100,
      mood: 1,
      energy: 100,
      streakDays: 0,
      stage: "Baby",
      triggers: ["hunger_high", "hunger_critical", "mood_dropped", "streak_broken"],
      recommendation:
        "You have not captured anything in 72h. Drop a thought - anything.",
      ascii: "(=;_;=)"
    }
  },
  {
    name: "healthy_user",
    now: new Date("2026-05-03T12:00:00.000Z"),
    stats: {
      capturesToday: 1,
      capturesLast7d: 10,
      closesToday: 1,
      closesLast7d: 18,
      openItems: 5,
      lastCaptureAt: "2026-05-03T10:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-04-01T00:00:00.000Z",
      lastRunAt: "2026-05-02T12:00:00.000Z",
      streakDays: 29,
      currentStage: "Child",
      vacationMode: false,
      lastHunger: 4,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 8,
      mood: 5,
      energy: 100,
      streakDays: 30,
      stage: "Teen",
      triggers: ["stage_advanced", "milestone_streak"],
      recommendation: "We just hit Teen. Keep the momentum going.",
      ascii: "(>_<)o"
    }
  },
  {
    name: "overloaded",
    now: new Date("2026-05-03T12:00:00.000Z"),
    stats: {
      capturesToday: 1,
      capturesLast7d: 5,
      closesToday: 0,
      closesLast7d: 1,
      openItems: 35,
      lastCaptureAt: "2026-05-03T07:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-04-01T00:00:00.000Z",
      lastRunAt: "2026-05-02T12:00:00.000Z",
      streakDays: 12,
      currentStage: "Child",
      vacationMode: false,
      lastHunger: 10,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 20,
      mood: 1,
      energy: 25,
      streakDays: 12,
      stage: "Child",
      triggers: ["energy_low", "mood_dropped"],
      recommendation: "You have 35 open items dragging me down. Close one. Just one.",
      ascii: "(T_T)"
    }
  },
  {
    name: "vacation",
    now: new Date("2026-05-03T22:00:00.000Z"),
    stats: {
      capturesToday: 0,
      capturesLast7d: 0,
      closesToday: 0,
      closesLast7d: 0,
      openItems: 12,
      lastCaptureAt: "2026-04-29T18:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-03-01T00:00:00.000Z",
      lastRunAt: "2026-05-02T22:00:00.000Z",
      streakDays: 40,
      currentStage: "Teen",
      vacationMode: true,
      lastHunger: 50,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 0,
      mood: 3,
      energy: 94,
      streakDays: 40,
      stage: "Teen",
      triggers: [],
      recommendation: "Getting stronger. What is next on the list?",
      ascii: "(-.-)"
    }
  },
  {
    name: "streak_at_risk",
    now: new Date("2026-05-03T21:00:00.000Z"),
    stats: {
      capturesToday: 0,
      capturesLast7d: 3,
      closesToday: 1,
      closesLast7d: 3,
      openItems: 6,
      lastCaptureAt: "2026-05-03T17:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-04-01T00:00:00.000Z",
      lastRunAt: "2026-05-03T16:00:00.000Z",
      streakDays: 6,
      currentStage: "Baby",
      vacationMode: false,
      lastHunger: 8,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 16,
      mood: 3,
      energy: 100,
      streakDays: 6,
      stage: "Baby",
      triggers: ["streak_at_risk"],
      recommendation:
        "It is past 8pm and nothing captured today. Log one thing before midnight.",
      ascii: "(=._.=)"
    }
  },
  {
    name: "stage_advance_to_baby",
    now: new Date("2026-05-03T12:00:00.000Z"),
    stats: {
      capturesToday: 1,
      capturesLast7d: 2,
      closesToday: 1,
      closesLast7d: 2,
      openItems: 3,
      lastCaptureAt: "2026-05-03T11:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-05-01T00:00:00.000Z",
      lastRunAt: "2026-05-02T12:00:00.000Z",
      streakDays: 2,
      currentStage: "Egg",
      vacationMode: false,
      lastHunger: 2,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 4,
      mood: 3,
      energy: 100,
      streakDays: 3,
      stage: "Baby",
      triggers: ["stage_advanced"],
      recommendation: "We just hit Baby. Keep the momentum going.",
      ascii: "(=._.=)"
    }
  },
  {
    name: "huge_vault",
    now: new Date("2026-05-03T12:00:00.000Z"),
    stats: {
      capturesToday: 1,
      capturesLast7d: 300,
      closesToday: 1,
      closesLast7d: 250,
      openItems: 1000,
      lastCaptureAt: "2026-05-03T11:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2025-11-01T00:00:00.000Z",
      lastRunAt: "2026-05-02T12:00:00.000Z",
      streakDays: 120,
      currentStage: "Adult",
      vacationMode: false,
      lastHunger: 1,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 4,
      mood: 2,
      energy: 0,
      streakDays: 121,
      stage: "Adult",
      triggers: ["energy_low", "mood_dropped"],
      recommendation:
        "You have 1000 open items dragging me down. Close one. Just one.",
      ascii: "(>_<)"
    }
  },
  {
    name: "corrupted_state",
    now: new Date("2026-05-03T12:00:00.000Z"),
    stats: {
      capturesToday: 0,
      capturesLast7d: 0,
      closesToday: 0,
      closesLast7d: 0,
      openItems: 9,
      lastCaptureAt: "2026-05-03T02:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: null,
      lastRunAt: null,
      streakDays: 0,
      currentStage: "Egg",
      vacationMode: false,
      lastHunger: null,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 40,
      mood: 2,
      energy: 100,
      streakDays: 0,
      stage: "Egg",
      triggers: [],
      recommendation: "Still hatching... keep going.",
      ascii: "(  ;_; )"
    }
  },
  {
    name: "clock_skew",
    now: new Date("2026-05-03T12:00:00.000Z"),
    stats: {
      capturesToday: 1,
      capturesLast7d: 4,
      closesToday: 1,
      closesLast7d: 4,
      openItems: 4,
      lastCaptureAt: "2026-05-03T11:00:00.000Z",
      excludedPaths
    },
    history: {
      firstRunAt: "2026-05-01T00:00:00.000Z",
      lastRunAt: "2026-05-03T13:00:00.000Z",
      streakDays: 14,
      currentStage: "Child",
      vacationMode: false,
      lastHunger: 9,
      lastTriggerFiredAt: {},
      suppressNegativeUntil: null
    },
    expected: {
      hunger: 0,
      mood: 3,
      energy: 100,
      streakDays: 14,
      stage: "Child",
      triggers: [],
      recommendation: "What are we building today?",
      ascii: "(-_-)"
    }
  }
];

