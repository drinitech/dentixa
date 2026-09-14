export type Role = "PATIENT" | "DOCTOR" | "ADMIN";
export type MembershipRole = "OWNER" | "RECEPTIONIST" | "DOCTOR" | "PATIENT";
export type AppointmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "DONE" | "NO_SHOW";
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
  specialty: string | null;
  isSuperAdmin: boolean;
}

export interface ClinicService {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | number | null;
  isActive?: boolean;
  recallIntervalMonths?: number | null;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive?: boolean;
}

export interface DoctorSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  specialty: string | null;
  locationId?: string | null;
  location?: { id: string; name: string } | null;
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

export interface ScheduleException {
  id: string;
  date: string;
  reason: string | null;
}

export interface ClinicHoliday {
  id: string;
  date: string;
  reason: string | null;
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
  visitNotes: string | null;
}

export interface WaitlistEntry {
  id: string;
  date: string;
  doctor: { id: string; name: string };
  service: { id: string; name: string };
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
  specialty: string | null;
  isActive: boolean;
  createdAt: string;
  locationId?: string | null;
  location?: { id: string; name: string } | null;
}

export type RecallStatus = "PENDING" | "NOTIFIED" | "BOOKED" | "DISMISSED";

export interface RecallReminder {
  id: string;
  dueDate: string;
  status: RecallStatus;
  doctor: { id: string; name: string };
  service: { id: string; name: string };
}

export interface DoctorStats {
  appointmentsThisWeek: number;
  rejectionsCount: number;
  pendingCount: number;
  doneCount: number;
  noShowCount: number;
}

export interface Invite {
  id: string;
  email: string;
  role: MembershipRole;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}

export interface SuperAdminTenant {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "PRO";
  status: "ACTIVE" | "SUSPENDED";
  appointmentCount: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; email: string };
}

export interface AdminStats {
  totalAppointments: number;
  byStatus: Record<string, number>;
  perDoctor: { doctorId: string; doctorName: string; total: number; approved: number; rejected: number }[];
  monthlyTrend: { month: string; count: number }[];
  todayCount: number;
  thisWeekCount: number;
  noShowRate: number;
  topServices: { serviceId: string; serviceName: string; count: number }[];
  estimatedRevenue: number;
  plan: "FREE" | "PRO";
  doctorCount: number;
  doctorLimit: number | null;
  appointmentsThisMonth: number;
  appointmentMonthlyLimit: number | null;
}
