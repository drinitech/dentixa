import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { resolveTenant } from "../middleware/resolveTenant";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveDoctors } from "../services/doctor.service";
import { getDoctorStats } from "../services/stats.service";
import { listDoctorReviews } from "../services/review.service";

export const doctorRouter = Router();

doctorRouter.use(authenticate, resolveTenant);

const listDoctorsQuerySchema = z.object({ locationId: z.string().min(1).optional() });

doctorRouter.get(
  "/",
  validate(listDoctorsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { locationId } = req.query as { locationId?: string };
    const doctors = await listActiveDoctors(req.tenantId!, locationId);
    res.json({ doctors });
  }),
);

doctorRouter.get(
  "/me/stats",
  authorize("DOCTOR"),
  asyncHandler(async (req, res) => {
    // Appointment is tenant-scoped by the Prisma extension — no explicit
    // tenantId needed here, it's read from the AsyncLocalStorage context
    // resolveTenant established above.
    const stats = await getDoctorStats(req.user!.id);
    res.json({ stats });
  }),
);

doctorRouter.get(
  "/:id/reviews",
  asyncHandler(async (req, res) => {
    // Review is likewise tenant-scoped automatically.
    const result = await listDoctorReviews(req.params.id);
    res.json(result);
  }),
);
