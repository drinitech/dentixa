import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveDoctors } from "../services/doctor.service";
import { getDoctorStats } from "../services/stats.service";
import { listDoctorReviews } from "../services/review.service";

export const doctorRouter = Router();

doctorRouter.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const doctors = await listActiveDoctors();
    res.json({ doctors });
  }),
);

doctorRouter.get(
  "/me/stats",
  authenticate,
  authorize("DOCTOR"),
  asyncHandler(async (req, res) => {
    const stats = await getDoctorStats(req.user!.id);
    res.json({ stats });
  }),
);

doctorRouter.get(
  "/:id/reviews",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await listDoctorReviews(req.params.id);
    res.json(result);
  }),
);
