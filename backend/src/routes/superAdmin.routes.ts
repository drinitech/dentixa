import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import { validate } from "../middleware/validate";
import { changePlanSchema } from "../validations/superAdmin.schema";
import {
  listTenantsHandler,
  changePlanHandler,
  suspendTenantHandler,
  activateTenantHandler,
} from "../controllers/superAdmin.controller";

export const superAdminRouter = Router();

superAdminRouter.use(authenticate, requireSuperAdmin);

superAdminRouter.get("/tenants", listTenantsHandler);
superAdminRouter.patch("/tenants/:id/plan", validate(changePlanSchema), changePlanHandler);
superAdminRouter.patch("/tenants/:id/suspend", suspendTenantHandler);
superAdminRouter.patch("/tenants/:id/activate", activateTenantHandler);
