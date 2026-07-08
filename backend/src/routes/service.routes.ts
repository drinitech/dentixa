import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveServices } from "../services/clinicService.service";

export const serviceRouter = Router();

serviceRouter.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const services = await listActiveServices();
    res.json({ services });
  }),
);
