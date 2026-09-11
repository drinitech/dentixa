import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  clinicServiceFindUnique,
  doctorScheduleFindMany,
  appointmentFindMany,
  scheduleExceptionFindUnique,
  clinicHolidayFindFirst,
  userFindUnique,
} = vi.hoisted(() => ({
  clinicServiceFindUnique: vi.fn(),
  doctorScheduleFindMany: vi.fn(),
  appointmentFindMany: vi.fn(),
  scheduleExceptionFindUnique: vi.fn(),
  clinicHolidayFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("../../lib/prisma", () => ({
  prisma: {
    clinicService: { findUnique: clinicServiceFindUnique },
    doctorSchedule: { findMany: doctorScheduleFindMany },
    appointment: { findMany: appointmentFindMany },
    scheduleException: { findUnique: scheduleExceptionFindUnique },
    clinicHoliday: { findFirst: clinicHolidayFindFirst },
    user: { findUnique: userFindUnique },
  },
}));

import { getFreeSlots } from "../slot.service";

describe("getFreeSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clinicServiceFindUnique.mockResolvedValue({ id: "svc-1", durationMinutes: 30, isActive: true });
    scheduleExceptionFindUnique.mockResolvedValue(null);
    clinicHolidayFindFirst.mockResolvedValue(null);
    userFindUnique.mockResolvedValue({ locationId: "location-1" });
  });

  it("returns every slot in the schedule window when nothing is booked", async () => {
    doctorScheduleFindMany.mockResolvedValue([{ startTime: "09:00", endTime: "10:00" }]);
    appointmentFindMany.mockResolvedValue([]);

    // Use a far-future date so the "exclude past times if today" branch never trims results.
    const slots = await getFreeSlots("doc-1", "2099-01-02", "svc-1");
    expect(slots).toEqual(["09:00", "09:30"]);
  });

  it("excludes slots that overlap an approved appointment", async () => {
    doctorScheduleFindMany.mockResolvedValue([{ startTime: "09:00", endTime: "10:00" }]);
    appointmentFindMany.mockResolvedValue([{ time: "09:00", durationMinutes: 30 }]);

    const slots = await getFreeSlots("doc-1", "2099-01-02", "svc-1");
    expect(slots).toEqual(["09:30"]);
  });

  it("returns no slots outside of any schedule window", async () => {
    doctorScheduleFindMany.mockResolvedValue([]);
    appointmentFindMany.mockResolvedValue([]);

    const slots = await getFreeSlots("doc-1", "2099-01-02", "svc-1");
    expect(slots).toEqual([]);
  });

  it("supports multiple schedule windows in the same day", async () => {
    doctorScheduleFindMany.mockResolvedValue([
      { startTime: "09:00", endTime: "09:30" },
      { startTime: "14:00", endTime: "15:00" },
    ]);
    appointmentFindMany.mockResolvedValue([]);

    const slots = await getFreeSlots("doc-1", "2099-01-02", "svc-1");
    expect(slots).toEqual(["09:00", "14:00", "14:30"]);
  });

  it("returns no slots on a date marked as a schedule exception", async () => {
    scheduleExceptionFindUnique.mockResolvedValue({ id: "exc-1", doctorId: "doc-1", date: new Date(), reason: null });
    doctorScheduleFindMany.mockResolvedValue([{ startTime: "09:00", endTime: "10:00" }]);
    appointmentFindMany.mockResolvedValue([]);

    const slots = await getFreeSlots("doc-1", "2099-01-02", "svc-1");
    expect(slots).toEqual([]);
    expect(doctorScheduleFindMany).not.toHaveBeenCalled();
  });

  it("returns no slots on a clinic-wide holiday, for any doctor", async () => {
    clinicHolidayFindFirst.mockResolvedValue({ id: "hol-1", date: new Date(), reason: "National holiday" });
    doctorScheduleFindMany.mockResolvedValue([{ startTime: "09:00", endTime: "10:00" }]);
    appointmentFindMany.mockResolvedValue([]);

    const slots = await getFreeSlots("doc-1", "2099-01-02", "svc-1");
    expect(slots).toEqual([]);
    expect(doctorScheduleFindMany).not.toHaveBeenCalled();
  });
});
