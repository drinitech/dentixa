import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { resolveTenant } from "../middleware/resolveTenant";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveLocations } from "../services/location.service";

export const locationRouter = Router();

locationRouter.get(
  "/",
  authenticate,
  resolveTenant,
  asyncHandler(async (_req, res) => {
    const locations = await listActiveLocations();
    res.json({ locations });
  }),
);
