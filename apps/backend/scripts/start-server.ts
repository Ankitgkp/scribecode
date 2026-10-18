import { createServer } from "node:http";

import app from "../src/handler";
import { env } from "../src/config/env";
import { logger } from "../src/config/logger";
import { disconnectPrisma } from "../src/lib/prisma";

async function start(): Promise<void> {
  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(env.PORT, resolve);
  });

  logger.info({ port: env.PORT, environment: env.NODE_ENV }, "API server listening");

  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutdown signal received, closing server");

    const forceExit = setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async (closeError) => {
      if (closeError) logger.error({ err: closeError }, "Error while closing the HTTP server");

      try {
        await disconnectPrisma();
      } catch (error) {
        logger.error({ err: error }, "Error while disconnecting Prisma");
      }

      clearTimeout(forceExit);
      process.exit(closeError ? 1 : 0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to start the server");
  process.exit(1);
});
