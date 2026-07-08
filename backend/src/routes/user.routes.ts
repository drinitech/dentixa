import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  updateNotificationPreferencesSchema,
  updateAvatarSchema,
  updateSpecialtySchema,
  updateProfileSchema,
} from "../validations/user.schema";
import {
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
  updateAvatarHandler,
  updateSpecialtyHandler,
  updateProfileHandler,
} from "../controllers/user.controller";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me/notification-preferences", getNotificationPreferencesHandler);
userRouter.patch(
  "/me/notification-preferences",
  validate(updateNotificationPreferencesSchema),
  updateNotificationPreferencesHandler,
);
userRouter.patch("/me/avatar", validate(updateAvatarSchema), updateAvatarHandler);
userRouter.patch(
  "/me/specialty",
  authorize("DOCTOR"),
  validate(updateSpecialtySchema),
  updateSpecialtyHandler,
);
userRouter.patch("/me/profile", validate(updateProfileSchema), updateProfileHandler);
