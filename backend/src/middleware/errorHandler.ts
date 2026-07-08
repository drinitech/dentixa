import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { ConflictError } from "../errors/ConflictError";
import { logger } from "../lib/logger";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // Unique-constraint violation from a schema-declared @@unique (e.g. duplicate email).
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const conflict = new ConflictError("A record with this value already exists");
    return res.status(conflict.statusCode).json({ error: conflict.message });
  }

  // Raw Postgres unique-violation (23505) — used by the partial unique index on
  // Appointment(doctorId, date, time) that Prisma's schema DSL cannot express.
  if (isPostgresUniqueViolation(err)) {
    const conflict = new ConflictError("This slot was just booked, please choose another time");
    return res.status(conflict.statusCode).json({ error: conflict.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

function isPostgresUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}
