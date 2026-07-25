import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SimpleAccordion from "./SimpleAccordion";

/**
 * The data layout depends on this: sections like "Character Structure" and
 * "Reading Usefulness" fetch their dataset from a `useEffect` in a hook inside
 * the accordion body. That is only lazy if a closed accordion does not mount
 * its children — Radix unmounts closed content, but adding `forceMount` to
 * `AccordionContent` (or swapping in a hidden-with-CSS accordion) would make
 * every detail drawer fetch every dataset. These tests fail if that happens.
 */

const renderProbe = ({ defaultOpen }: { defaultOpen?: boolean } = {}) => {
  const rendered = vi.fn();
  const Child = () => {
    rendered();
    return <span data-testid="child">body</span>;
  };

  render(
    <SimpleAccordion trigger="Character Structure" defaultOpen={defaultOpen}>
      <Child />
    </SimpleAccordion>
  );

  return rendered;
};

describe("SimpleAccordion", () => {
  it("does not mount its body while closed", () => {
    const rendered = renderProbe();

    expect(rendered).not.toHaveBeenCalled();
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("mounts the body on first expand", async () => {
    const rendered = renderProbe();

    await userEvent.click(screen.getByText("Character Structure"));

    expect(rendered).toHaveBeenCalled();
    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("mounts the body immediately when defaultOpen is set", () => {
    // "External Links" opens by default, so anything in a defaultOpen section
    // loads as soon as the drawer opens.
    const rendered = renderProbe({ defaultOpen: true });

    expect(rendered).toHaveBeenCalled();
  });
});
