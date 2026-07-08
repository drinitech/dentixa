import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as adminService from "../services/admin.service";
import * as appointmentService from "../services/appointment.service";
import * as clinicServiceService from "../services/clinicService.service";
import * as statsService from "../services/stats.service";
import { notifyWaitlistIfSlotsOpened } from "../services/waitlist.service";
import { buildAppointmentsWorkbook } from "../lib/excel";

export const createDoctorHandler = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await adminService.createDoctor(req.body);
  res.status(201).json({ doctor });
});

export const listDoctorsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const doctors = await adminService.listDoctors();
  res.json({ doctors });
});

export const updateDoctorHandler = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await adminService.updateDoctor(req.params.id, req.body);
  res.json({ doctor });
});

export const getDoctorServicesHandler = asyncHandler(async (req: Request, res: Response) => {
  const serviceIds = await adminService.getDoctorServices(req.params.id);
  res.json({ serviceIds });
});

export const setDoctorServicesHandler = asyncHandler(async (req: Request, res: Response) => {
  const serviceIds = await adminService.setDoctorServices(req.params.id, req.body.serviceIds);
  res.json({ serviceIds });
});

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.listUsers(req.query as any);
  res.json(result);
});

export const banUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.setUserActive(req.params.id, false);
  res.json({ user });
});

export const unbanUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.setUserActive(req.params.id, true);
  res.json({ user });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.resetPassword(req.params.id);
  res.json(result);
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.params.id);
  res.status(204).send();
});

export const globalAppointmentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await appointmentService.listAppointments(
    { role: "ADMIN", userId: req.user!.id },
    req.query as any,
  );
  res.json(result);
});

export const globalExportAppointmentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const appointments = await appointmentService.exportAppointments(
    { role: "ADMIN", userId: req.user!.id },
    req.query as any,
  );
  const buffer = await buildAppointmentsWorkbook(appointments);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="appointments.xlsx"');
  res.send(buffer);
});

export const overrideCancelAppointmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.cancelAppointment(req.params.id, {
    id: req.user!.id,
    role: "ADMIN",
  });
  await notifyWaitlistIfSlotsOpened(appt.doctorId, appt.date.toISOString().slice(0, 10));
  res.json({ appointment: appt });
});

export const listServicesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const services = await clinicServiceService.listAllServices();
  res.json({ services });
});

export const createServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const service = await clinicServiceService.createService(req.body);
  res.status(201).json({ service });
});

export const updateServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const service = await clinicServiceService.updateService(req.params.id, req.body);
  res.json({ service });
});

export const deactivateServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const service = await clinicServiceService.deactivateService(req.params.id);
  res.json({ service });
});

export const adminStatsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await statsService.getAdminStats();
  res.json({ stats });
});
