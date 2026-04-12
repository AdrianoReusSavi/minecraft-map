import prismarineAuth from "prismarine-auth";
import { config } from "./config.js";
import { log } from "./logger.js";

const { Authflow, Titles } = prismarineAuth;

export type AuthflowInstance = InstanceType<typeof Authflow>;

export function createAuthflow(): AuthflowInstance {
  return new Authflow(
    "realms-map",
    config.authCachePath,
    {
      flow: "sisu",
      authTitle: Titles.MinecraftJava,
      deviceType: "Win32",
    },
    (code: { verification_uri: string; user_code: string }) => {
      log.info("=== Microsoft Authentication ===");
      log.info(`Go to: ${code.verification_uri}`);
      log.info(`Enter code: ${code.user_code}`);
      log.info("================================");
    },
  );
}