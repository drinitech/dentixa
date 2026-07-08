import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlotGrid } from "../slot-grid";

describe("SlotGrid", () => {
  it("shows an empty state when there are no free slots", () => {
    render(<SlotGrid slots={[]} value={null} onChange={vi.fn()} isLoading={false} />);
    expect(screen.getByText(/no free slots/i)).toBeInTheDocument();
  });

  it("renders each slot and calls onChange when clicked", () => {
    const onChange = vi.fn();
    render(<SlotGrid slots={["09:00", "09:30"]} value={null} onChange={onChange} isLoading={false} />);

    expect(screen.getByText("09:00")).toBeInTheDocument();
    fireEvent.click(screen.getByText("09:30"));
    expect(onChange).toHaveBeenCalledWith("09:30");
  });

  it("shows skeletons while loading instead of slots", () => {
    render(<SlotGrid slots={undefined} value={null} onChange={vi.fn()} isLoading />);
    expect(screen.queryByText(/no free slots/i)).not.toBeInTheDocument();
  });
});
