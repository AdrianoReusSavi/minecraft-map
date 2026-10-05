import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

const TMP = join(import.meta.dirname, ".tmp-auth");

beforeEach(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

afterEach(async () => {
  await rm(TMP, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("encodeAuthCache", () => {
  it("encodes cache files to base64 JSON", async () => {
    await writeFile(join(TMP, "token.json"), '{"access_token":"abc"}');
    await writeFile(join(TMP, "profile.json"), '{"name":"Player"}');

    vi.stubEnv("AUTH_CACHE_PATH", TMP);

    const { encodeAuthCache } = await import("../src/setup.js");
    const encoded = await encodeAuthCache();
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString());

    expect(decoded["token.json"]).toBe('{"access_token":"abc"}');
    expect(decoded["profile.json"]).toBe('{"name":"Player"}');
  });

  it("handles empty cache directory", async () => {
    vi.stubEnv("AUTH_CACHE_PATH", TMP);

    const { encodeAuthCache } = await import("../src/setup.js");
    const encoded = await encodeAuthCache();
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString());

    expect(decoded).toEqual({});
  });
});