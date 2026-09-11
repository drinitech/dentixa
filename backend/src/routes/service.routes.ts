import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { resolveTenant } from "../middleware/resolveTenant";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../lib/asyncHandler";
import { listServicesQuerySchema } from "../validations/service.schema";
import { listActiveServices } from "../services/clinicService.service";

export const serviceRouter = Router();

serviceRouter.get(
  "/",
  authenticate,
  resolveTenant,
  validate(listServicesQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { doctorId } = req.query as { doctorId?: string };
    const services = await listActiveServices(doctorId);
    res.json({ services });
  }),
);
