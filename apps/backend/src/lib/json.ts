import type { Prisma } from "@/generated/prisma/client";

/** Casts a typed value into Prisma's JSON input type. */
export function toJsonInput<T>(value: T): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Reads a stored JSON column back into a typed value. */
export function fromJsonInput<T>(value: Prisma.JsonValue): T {
  return value as T;
}
