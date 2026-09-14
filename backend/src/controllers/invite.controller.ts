import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as inviteService from "../services/invite.service";
import { setRefreshCookie, serializeUser } from "./auth.controller";

export const createInviteHandler = asyncHandler(async (req: Request, res: Response) => {
  const invite = await inviteService.createInvite(req.tenantId!, req.user!.id, req.body);
  res.status(201).json({ invite });
});

export const listInvitesHandler = asyncHandler(async (req: Request, res: Response) => {
  const invites = await inviteService.listInvites(req.tenantId!);
  res.json({ invites });
});

export const revokeInviteHandler = asyncHandler(async (req: Request, res: Response) => {
  await inviteService.revokeInvite(req.tenantId!, req.params.id);
  res.status(204).send();
});

export const getInvitePreviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const preview = await inviteService.getInvitePreview(req.params.token);
  res.json(preview);
});

export const acceptInviteHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, tenantSlug, accessToken, refreshToken } = await inviteService.acceptInvite(
    req.params.token,
    req.body,
  );
  setRefreshCookie(res, refreshToken);
  res.json({ user: serializeUser(user), tenantSlug, accessToken });
});
