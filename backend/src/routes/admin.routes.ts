import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createDoctorSchema, updateDoctorSchema, listUsersQuerySchema } from "../validations/admin.schema";
import { adminListAppointmentsQuerySchema } from "../validations/appointment.schema";
import {
  clinicServiceSchema,
  updateClinicServiceSchema,
  setDoctorServicesSchema,
} from "../validations/service.schema";
import { createClinicHolidaySchema } from "../validations/clinicHoliday.schema";
import {
  createDoctorHandler,
  listDoctorsHandler,
  updateDoctorHandler,
  getDoctorServicesHandler,
  setDoctorServicesHandler,
  listUsersHandler,
  banUserHandler,
  unbanUserHandler,
  resetPasswordHandler,
  deleteUserHandler,
  globalAppointmentsHandler,
  globalExportAppointmentsHandler,
  overrideCancelAppointmentHandler,
  listServicesHandler,
  createServiceHandler,
  updateServiceHandler,
  deactivateServiceHandler,
  adminStatsHandler,
  listClinicHolidaysHandler,
  createClinicHolidayHandler,
  deleteClinicHolidayHandler,
} from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize("ADMIN"));

adminRouter.post("/doctors", validate(createDoctorSchema), createDoctorHandler);
adminRouter.get("/doctors", listDoctorsHandler);
adminRouter.patch("/doctors/:id", validate(updateDoctorSchema), updateDoctorHandler);
adminRouter.get("/doctors/:id/services", getDoctorServicesHandler);
adminRouter.put(
  "/doctors/:id/services",
  validate(setDoctorServicesSchema),
  setDoctorServicesHandler,
);

adminRouter.get("/users", validate(listUsersQuerySchema, "query"), listUsersHandler);
adminRouter.patch("/users/:id/ban", banUserHandler);
adminRouter.patch("/users/:id/unban", unbanUserHandler);
adminRouter.post("/users/:id/reset-password", resetPasswordHandler);
adminRouter.delete("/users/:id", deleteUserHandler);

adminRouter.get(
  "/appointments",
  validate(adminListAppointmentsQuerySchema, "query"),
  globalAppointmentsHandler,
);
adminRouter.get(
  "/appointments/export.xlsx",
  validate(adminListAppointmentsQuerySchema, "query"),
  globalExportAppointmentsHandler,
);
adminRouter.patch("/appointments/:id/cancel", overrideCancelAppointmentHandler);

adminRouter.get("/services", listServicesHandler);
adminRouter.post("/services", validate(clinicServiceSchema), createServiceHandler);
adminRouter.patch("/services/:id", validate(updateClinicServiceSchema), updateServiceHandler);
adminRouter.delete("/services/:id", deactivateServiceHandler);

adminRouter.get("/stats", adminStatsHandler);

adminRouter.get("/clinic-holidays", listClinicHolidaysHandler);
adminRouter.post(
  "/clinic-holidays",
  validate(createClinicHolidaySchema),
  createClinicHolidayHandler,
);
adminRouter.delete("/clinic-holidays/:id", deleteClinicHolidayHandler);
