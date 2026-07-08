import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { BadRequestError } from "../errors/BadRequestError";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new BadRequestError("Validation failed", result.error.flatten().fieldErrors);
    }
    // Overwrite with the parsed (and coerced/defaulted) data.
    (req as any)[source] = result.data;
    next();
  };
}
