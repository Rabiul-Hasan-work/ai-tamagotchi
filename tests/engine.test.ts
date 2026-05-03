import { describe, expect, it } from "vitest";
import { pickRecommendation } from "../src/recommendation/engine.js";
import { selectAscii } from "../src/renderer/ascii.js";
import { deriveState } from "../src/state/engine.js";
import { fixtures } from "./fixtures.js";

describe("state engine fixture scaffold", () => {
  it("loads all 10 named fixtures", () => {
    expect(fixtures).toHaveLength(10);
  });

  for (const fixture of fixtures) {
    it(`matches expected output for ${fixture.name}`, () => {
      const { state } = deriveState(fixture.stats, fixture.history, fixture.now);
      const recommendation = pickRecommendation(state);
      const ascii = selectAscii(state.stage, state.mood);

      expect(state.hunger).toBe(fixture.expected.hunger);
      expect(state.mood).toBe(fixture.expected.mood);
      expect(state.energy).toBe(fixture.expected.energy);
      expect(state.streakDays).toBe(fixture.expected.streakDays);
      expect(state.stage).toBe(fixture.expected.stage);
      expect(state.activeTriggers.map((t) => t.type)).toEqual(fixture.expected.triggers);
      expect(recommendation).toBe(fixture.expected.recommendation);
      expect(ascii).toBe(fixture.expected.ascii);
    });
  }
});

