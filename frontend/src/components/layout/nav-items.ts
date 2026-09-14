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
  UserPlus,
  ScrollText,
} from "lucide-react";
import type { NavItem } from "./app-shell";
import type { Role } from "@/types";

// Every authenticated route lives under /c/[slug] — these take the current
// route's slug (read via useParams()) rather than being static, since the
// same nav can point at different clinics depending on which one you're in.

export function patientNav(slug: string): NavItem[] {
  const base = `/c/${slug}`;
  return [
    { label: "Book appointment", href: `${base}/dashboard`, icon: CalendarPlus },
    { label: "My appointments", href: `${base}/appointments`, icon: ClipboardList },
    { label: "Profile", href: `${base}/profile`, icon: UserCog },
  ];
}

export function doctorNav(slug: string): NavItem[] {
  const base = `/c/${slug}/doctor`;
  return [
    { label: "Requests", href: `${base}/dashboard`, icon: ClipboardList },
    { label: "Calendar", href: `${base}/calendar`, icon: CalendarDays },
    { label: "Schedule", href: `${base}/schedule`, icon: Stethoscope },
    { label: "Stats", href: `${base}/stats`, icon: BarChart3 },
    { label: "Profile", href: `${base}/profile`, icon: UserCog },
  ];
}

export function adminNav(slug: string): NavItem[] {
  const base = `/c/${slug}/admin`;
  return [
    { label: "Overview", href: `${base}/dashboard`, icon: BarChart3 },
    { label: "Locations", href: `${base}/locations`, icon: Building2 },
    { label: "Doctors", href: `${base}/doctors`, icon: Stethoscope },
    { label: "Users", href: `${base}/users`, icon: Users },
    { label: "Staff invites", href: `${base}/staff`, icon: UserPlus },
    { label: "Appointments", href: `${base}/appointments`, icon: CalendarDays },
    { label: "Services", href: `${base}/services`, icon: Settings },
    { label: "Holidays", href: `${base}/holidays`, icon: CalendarOff },
    { label: "Audit log", href: `${base}/audit-log`, icon: ScrollText },
    { label: "Profile", href: `${base}/profile`, icon: UserCog },
  ];
}

export function roleHome(slug: string, role: Role): string {
  switch (role) {
    case "DOCTOR":
      return `/c/${slug}/doctor/dashboard`;
    case "ADMIN":
      return `/c/${slug}/admin/dashboard`;
    case "PATIENT":
    default:
      return `/c/${slug}/dashboard`;
  }
}

export function roleProfile(slug: string, role: Role): string {
  switch (role) {
    case "DOCTOR":
      return `/c/${slug}/doctor/profile`;
    case "ADMIN":
      return `/c/${slug}/admin/profile`;
    case "PATIENT":
    default:
      return `/c/${slug}/profile`;
  }
}
