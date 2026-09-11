import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as appointmentService from "../services/appointment.service";
import { notify } from "../services/notification.service";
import { notifyWaitlistIfSlotsOpened } from "../services/waitlist.service";
import { buildAppointmentsWorkbook } from "../lib/excel";
import { BadRequestError } from "../errors/BadRequestError";

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.createAppointment(req.user!.id, req.body);

  await notify(appt.doctorId, "APPOINTMENT_CREATED", {
    subject: "New appointment request",
    emailBody: `You have a new appointment request from ${appt.patient.name} on ${appt.date.toISOString().slice(0, 10)} at ${appt.time}.`,
    smsBody: `Dentixa: new appointment request from ${appt.patient.name} on ${appt.date.toISOString().slice(0, 10)} at ${appt.time}.`,
  });

  res.status(201).json({ appointment: appt });
});

export const listHandler = asyncHandler(async (req: Request, res: Response) => {
  const role = req.membership!.role;
  if (role !== "PATIENT" && role !== "DOCTOR") {
    throw new BadRequestError("Use /admin/appointments for a global view");
  }
  const result = await appointmentService.listAppointments(
    { role, userId: req.user!.id },
    req.query as any,
  );
  res.json(result);
});

export const approveHandler = asyncHandler(async (req: Request, res: Response) => {
  const { appointment, autoRejected } = await appointmentService.approveAppointment(
    req.params.id,
    req.user!.id,
  );

  await notify(appointment.patientId, "APPOINTMENT_APPROVED", {
    subject: "Your appointment was approved",
    emailBody: `Your appointment on ${appointment.date.toISOString().slice(0, 10)} at ${appointment.time} was approved.`,
    smsBody: `Dentixa: your appointment on ${appointment.date.toISOString().slice(0, 10)} at ${appointment.time} was approved.`,
  });

  for (const rejected of autoRejected) {
    await notify(rejected.patientId, "APPOINTMENT_REJECTED", {
      subject: "Your appointment request could not be confirmed",
      emailBody: "Unfortunately another patient's appointment was approved for the same time slot. Please request a different time.",
      smsBody: "Dentixa: your requested slot was just taken by another patient. Please pick a new time.",
    });
  }

  res.json({ appointment, autoRejectedCount: autoRejected.length });
});

export const rejectHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.rejectAppointment(
    req.params.id,
    req.user!.id,
    req.body?.rejectionReason,
  );

  await notify(appt.patientId, "APPOINTMENT_REJECTED", {
    subject: "Your appointment request was declined",
    emailBody: `Your appointment request on ${appt.date.toISOString().slice(0, 10)} at ${appt.time} was declined.${appt.rejectionReason ? ` Reason: ${appt.rejectionReason}` : ""}`,
    smsBody: `Dentixa: your appointment request on ${appt.date.toISOString().slice(0, 10)} at ${appt.time} was declined.`,
  });
  await notifyWaitlistIfSlotsOpened(appt.doctorId, appt.date.toISOString().slice(0, 10));

  res.json({ appointment: appt });
});

export const cancelHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.cancelAppointment(req.params.id, {
    id: req.user!.id,
    role: req.membership!.role as "PATIENT" | "DOCTOR" | "OWNER",
  });
  await notifyWaitlistIfSlotsOpened(appt.doctorId, appt.date.toISOString().slice(0, 10));
  res.json({ appointment: appt });
});

export const completeHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.completeAppointment(req.params.id, req.user!.id);
  res.json({ appointment: appt });
});

export const noShowHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.markNoShow(req.params.id, req.user!.id);
  res.json({ appointment: appt });
});

export const updateVisitNotesHandler = asyncHandler(async (req: Request, res: Response) => {
  const appt = await appointmentService.updateVisitNotes(req.params.id, req.user!.id, req.body.visitNotes);
  res.json({ appointment: appt });
});

export const exportHandler = asyncHandler(async (req: Request, res: Response) => {
  const role = req.membership!.role;
  if (role !== "PATIENT" && role !== "DOCTOR") {
    throw new BadRequestError("Use /admin/appointments/export.xlsx for a global view");
  }
  const appointments = await appointmentService.exportAppointments(
    { role, userId: req.user!.id },
    req.query as any,
  );
  const buffer = await buildAppointmentsWorkbook(appointments);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="appointments.xlsx"');
  res.send(buffer);
});
