import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";
import { EXCLUDED_PATH_SEGMENTS } from "../config.js";
import type { VaultStats } from "../types.js";

const dayInLocal = (d: Date): string => d.toISOString().slice(0, 10);

const isExcluded = (vaultRoot: string, targetPath: string): boolean => {
  const rel = relative(vaultRoot, targetPath);
  const parts = rel.split(sep).map((part) => part.toLowerCase());
  return parts.some((part) => EXCLUDED_PATH_SEGMENTS.includes(part));
};

const listFiles = async (root: string): Promise<string[]> => {
  const output: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const absolute = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(absolute);
          return;
        }
        if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
          output.push(absolute);
        }
      })
    );
  };
  await walk(root);
  return output;
};

export const collectVaultStats = async (
  vaultPath: string,
  now: Date
): Promise<VaultStats> => {
  const files = await listFiles(vaultPath);
  const today = dayInLocal(now);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  let capturesToday = 0;
  let capturesLast7d = 0;
  let closesToday = 0;
  let closesLast7d = 0;
  let openItems = 0;
  let lastCaptureAt: string | null = null;

  for (const file of files) {
    if (isExcluded(vaultPath, file)) continue;

    const fileStat = await stat(file);
    const iso = fileStat.mtime.toISOString();
    const mtime = fileStat.mtime;
    const isRecent7d = mtime >= sevenDaysAgo;
    const isToday = dayInLocal(mtime) === today;
    if (isRecent7d) capturesLast7d += 1;
    if (isToday) capturesToday += 1;
    if (!lastCaptureAt || new Date(lastCaptureAt) < mtime) {
      lastCaptureAt = iso;
    }

    const content = await readFile(file, "utf8");
    const openMatches = content.match(/^- \[ \]/gm) ?? [];
    const closedMatches = content.match(/^- \[x\]/gim) ?? [];
    openItems += openMatches.length;
    closesLast7d += isRecent7d ? closedMatches.length : 0;
    closesToday += basename(file) === `${today}.md` ? closedMatches.length : 0;
  }

  return {
    capturesToday,
    capturesLast7d,
    closesToday,
    closesLast7d,
    openItems,
    lastCaptureAt,
    excludedPaths: EXCLUDED_PATH_SEGMENTS
  };
};

