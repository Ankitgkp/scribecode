import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";

export interface HealthPayload {
  status: "ok";
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
  memory?: {
    rss: number;
    heapUsed: number;
  };
}

export interface HealthOptions {
  verbose?: boolean;
}

export function getHealth(options: HealthOptions = {}): HealthPayload {
  const payload: HealthPayload = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
  };

  if (options.verbose) {
    const usage = process.memoryUsage();
    payload.memory = { rss: usage.rss, heapUsed: usage.heapUsed };
  }

  return payload;
}

export interface ReadinessPayload {
  status: "ok";
  database: "up";
  timestamp: string;
}

/**
 * Readiness probe for dependencies (currently just the database).
 * The Prisma client is imported lazily so the liveness endpoint never needs a database.
 */
export async function getReadiness(): Promise<ReadinessPayload> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (error) {
    throw AppError.serviceUnavailable("Database is not reachable", { cause: String(error) });
  }

  return { status: "ok", database: "up", timestamp: new Date().toISOString() };
}
