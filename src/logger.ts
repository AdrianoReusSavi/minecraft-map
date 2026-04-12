function timestamp(): string {
  return new Date().toISOString();
}

export const log = {
  info(msg: string) {
    console.log(`[${timestamp()}] [INFO] ${msg}`);
  },
  warn(msg: string) {
    console.warn(`[${timestamp()}] [WARN] ${msg}`);
  },
  error(msg: string, err?: unknown) {
    console.error(`[${timestamp()}] [ERROR] ${msg}`);
    if (err instanceof Error) console.error(err.message);
  },
};