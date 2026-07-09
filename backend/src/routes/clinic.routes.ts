import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveClinics } from "../services/clinic.service";

export const clinicRouter = Router();

clinicRouter.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const clinics = await listActiveClinics();
    res.json({ clinics });
  }),
);
