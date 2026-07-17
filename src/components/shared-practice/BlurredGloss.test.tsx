import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlurredGloss } from "./BlurredGloss";

describe("BlurredGloss", () => {
  it("starts blurred and reveals on click", async () => {
    const user = userEvent.setup();
    render(<BlurredGloss text="water" resetKey={0} />);

    const button = screen.getByRole("button", {
      name: "Reveal English gloss",
    });
    await user.click(button);

    expect(
      screen.getByRole("button", { name: "Blur English gloss" })
    ).toBeInTheDocument();
  });

  it("re-blurs when resetKey changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BlurredGloss text="water" resetKey={0} />);

    await user.click(
      screen.getByRole("button", { name: "Reveal English gloss" })
    );
    expect(
      screen.getByRole("button", { name: "Blur English gloss" })
    ).toBeInTheDocument();

    rerender(<BlurredGloss text="water" resetKey={1} />);

    expect(
      screen.getByRole("button", { name: "Reveal English gloss" })
    ).toBeInTheDocument();
  });

  it("renders plain non-interactive text when blurrable is false", () => {
    render(<BlurredGloss text="water" resetKey={0} blurrable={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("water")).toBeInTheDocument();
  });

  it("shows the revealed state when forceReveal is set", () => {
    render(<BlurredGloss text="water" resetKey={0} forceReveal />);

    expect(
      screen.getByRole("button", { name: "Blur English gloss" })
    ).toBeInTheDocument();
  });

  it("renders an em dash when text is empty", () => {
    render(<BlurredGloss text="" resetKey={0} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
