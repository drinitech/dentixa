import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../lib/asyncHandler";
import { listActiveDoctors, getOrCreateCalendarToken, getDoctorCalendarFeed } from "../services/doctor.service";
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

doctorRouter.get(
  "/me/calendar-token",
  authenticate,
  authorize("DOCTOR"),
  asyncHandler(async (req, res) => {
    const token = await getOrCreateCalendarToken(req.user!.id);
    res.json({ token });
  }),
);

// Unauthenticated — calendar apps poll this URL directly and can't send an
// Authorization header, so the token query param is the credential.
doctorRouter.get(
  "/:id/calendar.ics",
  asyncHandler(async (req, res) => {
    const ics = await getDoctorCalendarFeed(req.params.id, String(req.query.token || ""));
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="dentixa-calendar.ics"');
    res.send(ics);
  }),
);
