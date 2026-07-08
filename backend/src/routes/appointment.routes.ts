import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createAppointmentSchema,
  rejectAppointmentSchema,
  listAppointmentsQuerySchema,
  updateVisitNotesSchema,
} from "../validations/appointment.schema";
import { createReviewSchema } from "../validations/review.schema";
import {
  createHandler,
  listHandler,
  approveHandler,
  rejectHandler,
  cancelHandler,
  completeHandler,
  noShowHandler,
  exportHandler,
  updateVisitNotesHandler,
} from "../controllers/appointment.controller";
import { createReviewHandler } from "../controllers/review.controller";

export const appointmentRouter = Router();

appointmentRouter.use(authenticate);

appointmentRouter.post("/", authorize("PATIENT"), validate(createAppointmentSchema), createHandler);
appointmentRouter.get("/", validate(listAppointmentsQuerySchema, "query"), listHandler);
appointmentRouter.get("/export.xlsx", validate(listAppointmentsQuerySchema, "query"), exportHandler);
appointmentRouter.patch("/:id/approve", authorize("DOCTOR"), approveHandler);
appointmentRouter.patch("/:id/reject", authorize("DOCTOR"), validate(rejectAppointmentSchema), rejectHandler);
appointmentRouter.patch("/:id/cancel", authorize("PATIENT", "DOCTOR"), cancelHandler);
appointmentRouter.patch("/:id/complete", authorize("DOCTOR"), completeHandler);
appointmentRouter.patch("/:id/no-show", authorize("DOCTOR"), noShowHandler);
appointmentRouter.patch(
  "/:id/notes",
  authorize("DOCTOR"),
  validate(updateVisitNotesSchema),
  updateVisitNotesHandler,
);
appointmentRouter.post(
  "/:id/review",
  authorize("PATIENT"),
  validate(createReviewSchema),
  createReviewHandler,
);
