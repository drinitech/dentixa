import { Router } from "express";
import { z } from "zod";
import { resolvePublicTenant } from "../middleware/resolvePublicTenant";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../lib/asyncHandler";
import { prismaUnscoped } from "../lib/prisma";
import { listPublicDoctors } from "../services/doctor.service";
import { listActiveServices } from "../services/clinicService.service";

// Unauthenticated — a prospective patient browsing a clinic's page before
// creating an account. Every route here must stay read-only and must never
// select a field a scraping bot shouldn't harvest (see listPublicDoctors).
export const publicRouter = Router();

publicRouter.use(resolvePublicTenant);

publicRouter.get(
  "/clinic",
  asyncHandler(async (req, res) => {
    const tenant = await prismaUnscoped.tenant.findUniqueOrThrow({ where: { id: req.tenantId! } });
    res.json({ clinic: { name: tenant.name, slug: tenant.slug, timezone: tenant.timezone } });
  }),
);

const listDoctorsQuerySchema = z.object({ locationId: z.string().min(1).optional() });

publicRouter.get(
  "/doctors",
  validate(listDoctorsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { locationId } = req.query as { locationId?: string };
    const doctors = await listPublicDoctors(req.tenantId!, locationId);
    res.json({ doctors });
  }),
);

publicRouter.get(
  "/services",
  asyncHandler(async (req, res) => {
    const services = await listActiveServices();
    res.json({ services });
  }),
);
