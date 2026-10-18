import { pino } from "pino";

import { env } from "@/config/env";

/**
 * Application-wide structured logger.
 * JSON is safe for serverless runtimes. Local development can opt into
 * human-readable output with LOG_PRETTY=true.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { env: env.NODE_ENV },
  ...(env.LOG_PRETTY
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname,env",
          },
        },
      }
    : {}),
});
