import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnnotatedCode } from "@/features/analysis/components/AnnotatedCode";
import type { FileBlock } from "@/features/analysis/types";

const content = ["import x from 'x';", "", "export function foo() {", "  return 1;", "}", "", "const y = 2;"].join(
  "\n",
);

const blocks: FileBlock[] = [
  {
    name: "foo",
    kind: "function",
    startLine: 3,
    endLine: 5,
    label: "Returns the constant 1",
    detail: "A longer explanation of foo.",
  },
];

describe("AnnotatedCode", () => {
  it("renders a callout beside each block with its label, kind and range", () => {
    render(<AnnotatedCode content={content} blocks={blocks} activeKey={null} onOpen={() => {}} />);

    expect(screen.getByText("Returns the constant 1")).toBeInTheDocument();
    expect(screen.getByText("foo")).toBeInTheDocument();
    expect(screen.getByText("function")).toBeInTheDocument();
    expect(screen.getByText("L3–5")).toBeInTheDocument();
  });

  it("marks unexplained runs as context", () => {
    render(<AnnotatedCode content={content} blocks={blocks} activeKey={null} onOpen={() => {}} />);

    // Two lines of imports above the block and two lines below it.
    expect(screen.getAllByText("2 lines")).toHaveLength(2);
  });

  it("opens a block when its 'More detail' affordance is clicked", () => {
    const onOpen = vi.fn();
    render(<AnnotatedCode content={content} blocks={blocks} activeKey={null} onOpen={onOpen} />);

    fireEvent.click(screen.getByText("More detail"));

    expect(onOpen).toHaveBeenCalledWith(blocks[0]);
  });
});
