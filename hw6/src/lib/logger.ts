type LogLevel = "debug" | "info" | "warn" | "error";

const formatMessage = (level: LogLevel, message: string) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const write =
  (level: LogLevel) =>
  (message: string, ...args: unknown[]) => {
    const formatted = formatMessage(level, message);
    switch (level) {
      case "debug":
        console.debug(formatted, ...args);
        break;
      case "info":
        console.info(formatted, ...args);
        break;
      case "warn":
        console.warn(formatted, ...args);
        break;
      case "error":
        console.error(formatted, ...args);
        break;
      default:
        console.log(formatted, ...args);
    }
  };

export const logger = {
  debug: write("debug"),
  info: write("info"),
  warn: write("warn"),
  error: write("error"),
};

