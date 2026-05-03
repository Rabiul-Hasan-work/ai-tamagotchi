import chokidar from "chokidar";

export const watchVault = async (
  vaultPath: string,
  onChange: () => Promise<void>
): Promise<() => Promise<void>> => {
  const watcher = chokidar.watch(vaultPath, {
    ignored: /(^|[\/\\])(\.git|node_modules)([\/\\]|$)/,
    ignoreInitial: true
  });

  const rerender = async (): Promise<void> => {
    await onChange();
  };

  watcher.on("add", rerender);
  watcher.on("change", rerender);
  watcher.on("unlink", rerender);

  return async () => {
    await watcher.close();
  };
};

