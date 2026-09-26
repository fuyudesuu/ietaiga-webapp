import { describe, expect, it } from "vitest";
import { addDays, formatDateOnly, formatInstant } from "./dates";

describe("dates", () => {
  it("keeps date-only values on the same calendar day", () => {
    expect(formatDateOnly("2026-11-14")).toContain("14 Nov");
  });

  it("formats the same instant in the source time zone", () => {
    // 06:00 UTC is 15:00 in Tokyo.
    expect(formatInstant("2026-10-03T06:00:00Z", "Asia/Tokyo")).toMatch(/03:00\s?pm/i);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});
