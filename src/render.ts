import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { config } from "./config.js";
import { log } from "./logger.js";

export async function renderMap(worldPath: string): Promise<void> {
  await mkdir(config.outputPath, { recursive: true });

  const args = [
    "web",
    "render",
    `--world=${worldPath}`,
    `--output=${config.outputPath}`,
    "--zoomin=4",
    "--shadows=true",
    "--background=#000000",
  ];

  if (config.minecraftJar) {
    args.push(`--java-client-jar=${config.minecraftJar}`);
  }

  log.info(`Rendering with uNmINeD (${args.length} args)`);

  return new Promise((resolve, reject) => {
    const child = spawn("unmined-cli", args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) {
        log.info(`Map rendered: ${config.outputPath}`);
        resolve();
      } else {
        reject(new Error(`unmined-cli exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}