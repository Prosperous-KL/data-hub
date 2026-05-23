const env = require("../config/env");

function formatLog(level, message, meta = {}) {
  const isProduction = env.NODE_ENV === "production";
  
  if (isProduction) {
    // Structured JSON for production logging (e.g. Datadog, CloudWatch)
    return JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  // Readable formatting for development
  let metaStr = "";
  if (meta && Object.keys(meta).length > 0) {
    if (meta.error && meta.error instanceof Error) {
      metaStr = `\n  Error: ${meta.error.message}\n  Stack: ${meta.error.stack}`;
    } else {
      metaStr = `\n  ${JSON.stringify(meta, null, 2)}`;
    }
  }
  
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

const logger = {
  info: (message, meta) => console.log(formatLog("info", message, meta)),
  warn: (message, meta) => console.warn(formatLog("warn", message, meta)),
  error: (message, meta) => console.error(formatLog("error", message, meta)),
  debug: (message, meta) => {
    if (env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, meta));
    }
  }
};

module.exports = logger;
