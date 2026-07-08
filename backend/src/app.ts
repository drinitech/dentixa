import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { router } from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  // Default 100kb is too small for a profile-picture data URI; images are
  // resized client-side first, so 3mb comfortably covers it either way.
  app.use(express.json({ limit: "3mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
