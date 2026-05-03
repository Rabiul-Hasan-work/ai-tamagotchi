import type { TamaState } from "../types.js";
import { selectAscii, toMoodVariant } from "./ascii.js";

const CARD_WIDTH = 45;
const SCREEN_WIDTH = 58;
const useColor = !("NO_COLOR" in process.env);
const ansi = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  fgGold: "\u001b[38;5;220m",
  fgBlue: "\u001b[38;5;111m",
  fgGray: "\u001b[38;5;250m",
  fgRed: "\u001b[38;5;203m",
  fgGreen: "\u001b[38;5;120m",
  bgPanel: "\u001b[48;5;234m"
};

const color = (text: string, code: string): string =>
  useColor ? `${code}${text}${ansi.reset}` : text;

const pad = (value: string, width: number): string =>
  value.length >= width ? value.slice(0, width) : value.padEnd(width, " ");

const wrap = (text: string, width: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
};

const meter = (value: number, max = 100, width = 10): string => {
  const clamped = Math.max(0, Math.min(value, max));
  const filled = Math.round((clamped / max) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
};

const stageClass = (stage: TamaState["stage"]): string => {
  switch (stage) {
    case "Egg":
      return "SEED";
    case "Baby":
      return "SPROUT";
    case "Child":
      return "APPRENTICE";
    case "Teen":
      return "HACKER";
    case "Adult":
      return "GUARDIAN";
    case "Elder":
      return "SAGE";
  }
};

export const renderTerminalView = (
  state: TamaState,
  recommendation: string
): string => {
  const face = selectAscii(state.stage, state.mood);
  const mood = toMoodVariant(state.mood).toUpperCase();
  const title = process.env.TAMA_NAME?.trim() || "Dagmar";
  const badge =
    state.streakDays >= 100
      ? "LEGENDARY"
      : state.streakDays >= 30
        ? "ELITE"
        : state.streakDays >= 7
          ? "RISING"
          : "ROOKIE";
  const quote = wrap(`"${recommendation}"`, CARD_WIDTH - 4);
  const cwd = process.cwd();
  const label = process.env.TAMA_LABEL?.trim() || "/buddy";
  const version = "AI Tamagotchi v0.1";
  const model = process.env.TAMA_MODEL?.trim() || "opus + claude style";

  const top: string[] = [];
  top.push(color(` ${version}`, ansi.fgBlue));
  top.push(color(` ${model}`, ansi.fgGray));
  top.push(color(` ${cwd}`, ansi.dim));
  top.push("");
  top.push(color(` ${label}`, ansi.bgPanel));
  top.push("");

  const lines: string[] = [];
  lines.push(color(`╔${"═".repeat(CARD_WIDTH)}╗`, ansi.fgGold));
  lines.push(
    color(
      `║ ${pad(`${badge}  ${stageClass(state.stage)}`, 24)}${pad(state.stage.toUpperCase(), CARD_WIDTH - 25)}║`,
      ansi.fgGold
    )
  );
  lines.push(color(`║ ${pad(`${mood} FORM`, CARD_WIDTH - 2)}║`, ansi.fgGold));
  lines.push(`│ ${pad("", CARD_WIDTH - 2)}│`);
  lines.push(
    `│ ${pad(
      mood === "SAD" ? color(face, ansi.fgRed) : mood === "HAPPY" ? color(face, ansi.fgGreen) : face,
      CARD_WIDTH - 2
    )}│`
  );
  lines.push(`│ ${pad("", CARD_WIDTH - 2)}│`);
  lines.push(`│ ${pad(title, CARD_WIDTH - 2)}│`);
  lines.push(`│ ${pad("", CARD_WIDTH - 2)}│`);
  for (const q of quote) lines.push(`│ ${pad(q, CARD_WIDTH - 2)}│`);
  lines.push(`│ ${pad("", CARD_WIDTH - 2)}│`);
  lines.push(
    `│ ${pad(`HUNGER   ${meter(state.hunger)} ${state.hunger.toString().padStart(3, " ")}`, CARD_WIDTH - 2)}│`
  );
  lines.push(
    `│ ${pad(`MOOD     ${meter(state.mood * 20)} ${(state.mood * 20).toString().padStart(3, " ")}`, CARD_WIDTH - 2)}│`
  );
  lines.push(
    `│ ${pad(`ENERGY   ${meter(state.energy)} ${state.energy.toString().padStart(3, " ")}`, CARD_WIDTH - 2)}│`
  );
  lines.push(
    `│ ${pad(`STREAK   ${meter(Math.min(state.streakDays, 100))} ${state.streakDays.toString().padStart(3, " ")}d`, CARD_WIDTH - 2)}│`
  );
  lines.push(color(`╚${"═".repeat(CARD_WIDTH)}╝`, ansi.fgGold));
  return [...top, ...lines.map((line) => pad(line, SCREEN_WIDTH))].join("\n");
};

