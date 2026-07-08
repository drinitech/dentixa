import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { replaceScheduleSchema, slotsQuerySchema, createExceptionSchema } from "../validations/schedule.schema";
import {
  getMyScheduleHandler,
  replaceMyScheduleHandler,
  slotsHandler,
  listExceptionsHandler,
  createExceptionHandler,
  deleteExceptionHandler,
} from "../controllers/schedule.controller";

export const scheduleRouter = Router();

scheduleRouter.use(authenticate);

scheduleRouter.get("/", authorize("DOCTOR"), getMyScheduleHandler);
scheduleRouter.put("/", authorize("DOCTOR"), validate(replaceScheduleSchema), replaceMyScheduleHandler);
scheduleRouter.get("/slots", validate(slotsQuerySchema, "query"), slotsHandler);
scheduleRouter.get("/exceptions", authorize("DOCTOR"), listExceptionsHandler);
scheduleRouter.post(
  "/exceptions",
  authorize("DOCTOR"),
  validate(createExceptionSchema),
  createExceptionHandler,
);
scheduleRouter.delete("/exceptions/:id", authorize("DOCTOR"), deleteExceptionHandler);
