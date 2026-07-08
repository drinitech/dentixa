import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { registerSchema, loginSchema } from "../validations/auth.schema";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), registerHandler);
authRouter.post("/login", authLimiter, validate(loginSchema), loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", authenticate, meHandler);
