import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { findWorldDir } from "../src/realms.js";

const TMP = join(import.meta.dirname, ".tmp");

beforeEach(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

afterEach(async () => {
  await rm(TMP, { recursive: true, force: true });
});

describe("findWorldDir", () => {
  it("finds level.dat in root directory", async () => {
    await writeFile(join(TMP, "level.dat"), "");

    const result = await findWorldDir(TMP);
    expect(result).toBe(TMP);
  });

  it("finds level.dat in subdirectory", async () => {
    const worldDir = join(TMP, "world");
    await mkdir(worldDir);
    await writeFile(join(worldDir, "level.dat"), "");

    const result = await findWorldDir(TMP);
    expect(result).toBe(worldDir);
  });

  it("throws when no level.dat exists", async () => {
    await expect(findWorldDir(TMP)).rejects.toThrow("No level.dat found");
  });

  it("ignores files that are not level.dat", async () => {
    await writeFile(join(TMP, "other.dat"), "");

    await expect(findWorldDir(TMP)).rejects.toThrow("No level.dat found");
  });

  it("finds level.dat in first matching subdirectory", async () => {
    const worldDir = join(TMP, "saves");
    await mkdir(worldDir);
    await writeFile(join(worldDir, "level.dat"), "");
    await mkdir(join(TMP, "empty"));

    const result = await findWorldDir(TMP);
    expect(result).toBe(worldDir);
  });
});