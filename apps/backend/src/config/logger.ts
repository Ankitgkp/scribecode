import { pino } from "pino";

import { env, isProduction } from "@/config/env";

/**
 * Application-wide structured logger.
 * Human-readable output in development, JSON in production.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { env: env.NODE_ENV },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname,env",
          },
        },
      }),
});
