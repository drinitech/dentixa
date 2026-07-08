import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";

describe("StatusBadge", () => {
  it.each([
    ["PENDING", "Pending"],
    ["APPROVED", "Approved"],
    ["REJECTED", "Rejected"],
    ["CANCELLED", "Cancelled"],
  ] as const)("renders the label for %s", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
