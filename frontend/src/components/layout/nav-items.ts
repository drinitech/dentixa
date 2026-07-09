import {
  CalendarPlus,
  ClipboardList,
  UserCog,
  Users,
  Stethoscope,
  CalendarDays,
  BarChart3,
  Settings,
  CalendarOff,
  Building2,
} from "lucide-react";
import type { NavItem } from "./app-shell";
import type { Role } from "@/types";

export const patientNav: NavItem[] = [
  { label: "Book appointment", href: "/dashboard", icon: CalendarPlus },
  { label: "My appointments", href: "/appointments", icon: ClipboardList },
  { label: "Profile", href: "/profile", icon: UserCog },
];

export const doctorNav: NavItem[] = [
  { label: "Requests", href: "/doctor/dashboard", icon: ClipboardList },
  { label: "Calendar", href: "/doctor/calendar", icon: CalendarDays },
  { label: "Schedule", href: "/doctor/schedule", icon: Stethoscope },
  { label: "Stats", href: "/doctor/stats", icon: BarChart3 },
  { label: "Profile", href: "/doctor/profile", icon: UserCog },
];

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Clinics", href: "/admin/clinics", icon: Building2 },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { label: "Services", href: "/admin/services", icon: Settings },
  { label: "Holidays", href: "/admin/holidays", icon: CalendarOff },
  { label: "Profile", href: "/admin/profile", icon: UserCog },
];

export const ROLE_HOME: Record<Role, string> = {
  PATIENT: "/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

export const ROLE_PROFILE: Record<Role, string> = {
  PATIENT: "/profile",
  DOCTOR: "/doctor/profile",
  ADMIN: "/admin/profile",
};
