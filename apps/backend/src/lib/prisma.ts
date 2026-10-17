import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

/**
 * Reusable Prisma client instance.
 * Connections are established lazily, so importing this module does not require
 * a running database.
 */
export const prisma = new PrismaClient({ adapter });

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.debug("Prisma client disconnected");
}
