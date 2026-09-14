import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/auth.schema";
import { registerClinicSchema } from "../validations/tenant.schema";
import {
  registerHandler,
  registerClinicHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), registerHandler);
authRouter.post(
  "/register-clinic",
  authLimiter,
  validate(registerClinicSchema),
  registerClinicHandler,
);
authRouter.post("/login", authLimiter, validate(loginSchema), loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", authenticate, meHandler);
authRouter.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePasswordHandler,
);
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordHandler,
);
authRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordHandler,
);
