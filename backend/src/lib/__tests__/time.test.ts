import { describe, expect, it } from "vitest";
import { minutesToTime, rangesOverlap, timeToMinutes } from "../time";

describe("timeToMinutes / minutesToTime", () => {
  it("converts HH:mm to minutes and back", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(1439)).toBe("23:59");
  });
});

describe("rangesOverlap", () => {
  it("detects a fully overlapping range", () => {
    const a = { time: "09:00", durationMinutes: 60 };
    const b = { time: "09:15", durationMinutes: 30 };
    expect(rangesOverlap(a, b)).toBe(true);
  });

  it("detects a partial overlap", () => {
    const a = { time: "09:00", durationMinutes: 30 }; // 09:00-09:30
    const b = { time: "09:15", durationMinutes: 30 }; // 09:15-09:45
    expect(rangesOverlap(a, b)).toBe(true);
  });

  it("treats back-to-back appointments as non-overlapping", () => {
    const a = { time: "09:00", durationMinutes: 30 }; // ends 09:30
    const b = { time: "09:30", durationMinutes: 30 }; // starts 09:30
    expect(rangesOverlap(a, b)).toBe(false);
  });

  it("returns false for appointments on unrelated times", () => {
    const a = { time: "09:00", durationMinutes: 30 };
    const b = { time: "14:00", durationMinutes: 30 };
    expect(rangesOverlap(a, b)).toBe(false);
  });

  it("is symmetric regardless of argument order", () => {
    const a = { time: "09:00", durationMinutes: 45 };
    const b = { time: "09:30", durationMinutes: 15 };
    expect(rangesOverlap(a, b)).toBe(rangesOverlap(b, a));
  });
});
