import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, details);
  }
}
