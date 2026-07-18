import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecognizingStatus } from "./RecognizingStatus";

describe("RecognizingStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows only the label before the delay", () => {
    render(<RecognizingStatus label="Recognizing…" delayMs={200} />);
    expect(screen.getByText("Recognizing…")).toBeInTheDocument();
    expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
  });

  it("fades in a 10ms count-up after the delay", () => {
    render(<RecognizingStatus label="Recognizing…" delayMs={200} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText("200ms")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(screen.getByText("230ms")).toBeInTheDocument();
  });
});
