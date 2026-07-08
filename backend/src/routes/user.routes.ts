import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { updateNotificationPreferencesSchema, updateAvatarSchema } from "../validations/user.schema";
import {
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
  updateAvatarHandler,
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
