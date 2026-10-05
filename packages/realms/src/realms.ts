import prismarineRealms from "prismarine-realms";
import { mkdir, rm, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { extract } from "tar";
import { type AuthflowInstance } from "./auth.js";
import { config } from "./config.js";
import { log } from "./logger.js";
import { withRetry } from "./retry.js";

const { RealmAPI } = prismarineRealms;

export interface BackupResult {
  worldPath: string;
  realmName: string;
}

export async function findWorldDir(dir: string): Promise<string> {
  try {
    await access(join(dir, "level.dat"));
    return dir;
  } catch {}

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      try {
        await access(join(dir, entry.name, "level.dat"));
        return join(dir, entry.name);
      } catch {}
    }
  }

  throw new Error(`No level.dat found in ${dir}`);
}

export async function createRealmsApi(auth: AuthflowInstance) {
  return RealmAPI.from(auth, "java");
}

export async function listRealms(api: ReturnType<typeof RealmAPI.from>) {
  const realms = await api.getRealms();

  log.info(`Found ${realms.length} Realm(s)`);
  for (const realm of realms) {
    log.info(`  ID: ${realm.id} | Name: ${realm.name} | Owner: ${realm.owner ?? "you"} | State: ${realm.state}`);
  }

  return realms;
}

export async function downloadBackup(api: ReturnType<typeof RealmAPI.from>): Promise<BackupResult> {
  const realm = await withRetry(
    () => api.getRealm(config.realmId),
    "Fetch realm info",
  );
  const realmName = realm.name;

  const download = await withRetry(
    () => realm.getWorldDownload(),
    "Get world download",
  );

  await rm(config.backupPath, { recursive: true, force: true });
  await mkdir(config.backupPath, { recursive: true });

  await withRetry(
    () => download.writeToDirectory(config.backupPath),
    "Download backup",
  );

  const files = await readdir(config.backupPath);
  const tarFile = files.find((f) => f.endsWith(".tar.gz"));
  if (!tarFile) {
    throw new Error("No .tar.gz found after download");
  }

  log.info(`Backup saved: ${tarFile}`);

  const extractPath = join(config.backupPath, "extracted");
  await mkdir(extractPath, { recursive: true });
  await extract({ file: join(config.backupPath, tarFile), cwd: extractPath });

  const worldPath = await findWorldDir(extractPath);
  log.info(`World extracted: ${worldPath}`);

  return { worldPath, realmName };
}