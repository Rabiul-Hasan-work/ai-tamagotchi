#!/usr/bin/env node
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { Command } from "commander";
import { pickRecommendation } from "./recommendation/engine.js";
import { renderTerminalView } from "./renderer/render.js";
import { deriveState } from "./state/engine.js";
import { loadHistory, saveHistory } from "./state/history-store.js";
import { collectVaultStats } from "./state/vault-scan.js";
import { watchVault } from "./watch.js";

const program = new Command();
program
  .name("tama")
  .description("AI Tamagotchi terminal assistant")
  .option("-w, --watch", "Stay open and re-render on vault change")
  .option("-q, --quiet", "Render only when an active trigger exists")
  .option("-v, --vault <path>", "Path to vault root", process.cwd())
  .option(
    "-s, --state <path>",
    "Path to state history JSON",
    join(homedir(), ".tama", "state.json")
  );

const runOnce = async (opts: {
  vault: string;
  state: string;
  quiet: boolean;
}): Promise<void> => {
  const now = new Date();
  const history = await loadHistory(opts.state);
  const stats = await collectVaultStats(opts.vault, now);
  const { state, nextHistory } = deriveState(stats, history, now);
  const recommendation = pickRecommendation(state);

  if (!opts.quiet || state.activeTriggers.length > 0) {
    process.stdout.write(`${renderTerminalView(state, recommendation)}\n`);
  }

  await saveHistory(opts.state, nextHistory);
};

const main = async (): Promise<void> => {
  const opts = program.parse(process.argv).opts<{
    watch?: boolean;
    quiet?: boolean;
    vault: string;
    state: string;
  }>();

  const run = async () =>
    runOnce({
      vault: resolve(opts.vault),
      state: resolve(opts.state),
      quiet: Boolean(opts.quiet)
    });

  await run();
  if (!opts.watch) return;

  const stop = await watchVault(resolve(opts.vault), run);
  process.on("SIGINT", async () => {
    await stop();
    process.exit(0);
  });
};

main().catch((error) => {
  process.stderr.write(`tama failed: ${(error as Error).message}\n`);
  process.exit(1);
});

