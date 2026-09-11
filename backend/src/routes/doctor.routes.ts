import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveDoctors } from "../services/doctor.service";
import { getDoctorStats } from "../services/stats.service";
import { listDoctorReviews } from "../services/review.service";

export const doctorRouter = Router();

const listDoctorsQuerySchema = z.object({ locationId: z.string().min(1).optional() });

doctorRouter.get(
  "/",
  authenticate,
  validate(listDoctorsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { locationId } = req.query as { locationId?: string };
    const doctors = await listActiveDoctors(locationId);
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
