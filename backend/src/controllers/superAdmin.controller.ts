import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as superAdminService from "../services/superAdmin.service";

export const listTenantsHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenants = await superAdminService.listTenants();
  res.json({ tenants });
});

export const changePlanHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await superAdminService.changePlan(req.params.id, req.body.plan, req.user!.id);
  res.json({ tenant });
});

export const suspendTenantHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await superAdminService.setTenantStatus(req.params.id, "SUSPENDED", req.user!.id);
  res.json({ tenant });
});

export const activateTenantHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await superAdminService.setTenantStatus(req.params.id, "ACTIVE", req.user!.id);
  res.json({ tenant });
});
