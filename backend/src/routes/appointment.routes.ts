import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createAppointmentSchema,
  rejectAppointmentSchema,
  listAppointmentsQuerySchema,
} from "../validations/appointment.schema";
import { createReviewSchema } from "../validations/review.schema";
import {
  createHandler,
  listHandler,
  approveHandler,
  rejectHandler,
  cancelHandler,
  completeHandler,
} from "../controllers/appointment.controller";
import { createReviewHandler } from "../controllers/review.controller";

export const appointmentRouter = Router();

appointmentRouter.use(authenticate);

appointmentRouter.post("/", authorize("PATIENT"), validate(createAppointmentSchema), createHandler);
appointmentRouter.get("/", validate(listAppointmentsQuerySchema, "query"), listHandler);
appointmentRouter.patch("/:id/approve", authorize("DOCTOR"), approveHandler);
appointmentRouter.patch("/:id/reject", authorize("DOCTOR"), validate(rejectAppointmentSchema), rejectHandler);
appointmentRouter.patch("/:id/cancel", authorize("PATIENT", "DOCTOR"), cancelHandler);
appointmentRouter.patch("/:id/complete", authorize("DOCTOR"), completeHandler);
appointmentRouter.post(
  "/:id/review",
  authorize("PATIENT"),
  validate(createReviewSchema),
  createReviewHandler,
);
