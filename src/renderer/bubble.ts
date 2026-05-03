const MAX_WIDTH = 40;

const wrap = (text: string, width: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= width) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const renderSpeechBubble = (message: string): string => {
  const lines = wrap(message, MAX_WIDTH);
  const width = Math.min(
    MAX_WIDTH,
    Math.max(...lines.map((line) => line.length), 0)
  );

  const top = `  .${"-".repeat(width + 2)}.`;
  const body = lines
    .map((line) => `  | ${line.padEnd(width, " ")} |`)
    .join("\n");
  const bottom = `  '${"-".repeat(width + 2)}'`;
  return [top, body, bottom].join("\n");
};

