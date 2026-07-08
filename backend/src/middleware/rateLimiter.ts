import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});
