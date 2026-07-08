import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { joinWaitlistSchema } from "../validations/waitlist.schema";
import {
  joinWaitlistHandler,
  listMyWaitlistHandler,
  leaveWaitlistHandler,
} from "../controllers/waitlist.controller";

export const waitlistRouter = Router();

waitlistRouter.use(authenticate, authorize("PATIENT"));

waitlistRouter.post("/", validate(joinWaitlistSchema), joinWaitlistHandler);
waitlistRouter.get("/me", listMyWaitlistHandler);
waitlistRouter.delete("/:id", leaveWaitlistHandler);
