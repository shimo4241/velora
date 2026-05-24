type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV === "development";

function log(level: LogLevel, message: unknown, ...args: unknown[]) {
  if (!isDev && level !== "error") return;
  if (typeof message === "string") {
    console[level](`[Velora] ${message}`, ...args);
  } else {
    console[level](`[Velora]`, message, ...args);
  }
}

export const logger = {
  debug: (msg: unknown, ...args: unknown[]) => log("debug", msg, ...args),
  info:  (msg: unknown, ...args: unknown[]) => log("info",  msg, ...args),
  warn:  (msg: unknown, ...args: unknown[]) => log("warn",  msg, ...args),
  error: (msg: unknown, ...args: unknown[]) => log("error", msg, ...args),
};
