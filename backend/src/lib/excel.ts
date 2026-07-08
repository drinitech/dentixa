import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  DONE: "Done",
  NO_SHOW: "No-show",
};

type ExportableAppointment = Prisma.AppointmentGetPayload<{
  include: {
    patient: { select: { name: true; email: true } };
    doctor: { select: { name: true; email: true } };
    service: { select: { name: true } };
  };
}>;

export async function buildAppointmentsWorkbook(appointments: ExportableAppointment[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Appointments");

  sheet.columns = [
    { header: "Patient", key: "patient", width: 24 },
    { header: "Patient email", key: "patientEmail", width: 28 },
    { header: "Doctor", key: "doctor", width: 24 },
    { header: "Service", key: "service", width: 20 },
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 8 },
    { header: "Duration (min)", key: "duration", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Reason", key: "reason", width: 30 },
    { header: "Rejection reason", key: "rejectionReason", width: 30 },
    { header: "Requested at", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const appt of appointments) {
    sheet.addRow({
      patient: appt.patient.name,
      patientEmail: appt.patient.email,
      doctor: appt.doctor.name,
      service: appt.service?.name ?? "",
      date: appt.date.toISOString().slice(0, 10),
      time: appt.time,
      duration: appt.durationMinutes,
      status: STATUS_LABELS[appt.status] ?? appt.status,
      reason: appt.reason ?? "",
      rejectionReason: appt.rejectionReason ?? "",
      createdAt: appt.createdAt.toISOString().slice(0, 16).replace("T", " "),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
