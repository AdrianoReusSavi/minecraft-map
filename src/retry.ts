import { log } from "./logger.js";

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  retries = 3,
  delayMs = 5000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) {
        log.error(`${label} failed after ${retries} attempts`, err);
        throw err;
      }
      log.warn(`${label} failed (attempt ${attempt}/${retries}), retrying in ${delayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Unreachable");
}