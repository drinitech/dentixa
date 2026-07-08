export type Role = "PATIENT" | "DOCTOR" | "ADMIN";
export type AppointmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "DONE";
export type NotificationChannel = "EMAIL" | "SMS";
export type NotificationEventType =
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_APPROVED"
  | "APPOINTMENT_REJECTED"
  | "REMINDER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
}

export interface ClinicService {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | number | null;
  isActive?: boolean;
}

export interface DoctorSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  averageRating?: number | null;
  reviewCount?: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
}

export interface DoctorReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: { id: string; name: string };
}

export interface DoctorScheduleWindow {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string | null;
  date: string;
  time: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  patient: { id: string; name: string; email: string; phone: string | null };
  doctor: { id: string; name: string; email: string };
  service: { id: string; name: string; durationMinutes: number; price: string | number | null } | null;
  review: Review | null;
}

export interface NotificationPreference {
  id: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  enabled: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DoctorStats {
  appointmentsThisWeek: number;
  rejectionsCount: number;
  pendingCount: number;
  doneCount: number;
}

export interface AdminStats {
  totalAppointments: number;
  byStatus: Record<string, number>;
  perDoctor: { doctorId: string; doctorName: string; total: number; approved: number; rejected: number }[];
  monthlyTrend: { month: string; count: number }[];
}
