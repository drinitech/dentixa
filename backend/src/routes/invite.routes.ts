import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { acceptInviteSchema } from "../validations/invite.schema";
import { getInvitePreviewHandler, acceptInviteHandler } from "../controllers/invite.controller";

// Public — the invitee isn't a member of any tenant yet, so there's no
// X-Tenant-Slug/Membership to resolve against (see invite.service.ts).
export const inviteRouter = Router();

inviteRouter.get("/:token", getInvitePreviewHandler);
inviteRouter.post(
  "/:token/accept",
  authLimiter,
  validate(acceptInviteSchema),
  acceptInviteHandler,
);
