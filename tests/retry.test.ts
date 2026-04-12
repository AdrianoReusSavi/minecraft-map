import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../src/retry.js";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await withRetry(fn, "test");
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, "test", 3, 10);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after all retries exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(withRetry(fn, "test", 2, 10)).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("respects retry count", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(withRetry(fn, "test", 5, 10)).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(5);
  });
});