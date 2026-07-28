import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import MarkdownPreview from "../MarkdownPreview";

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

afterEach(cleanup);

/** Click preceded by a pointerdown at the same spot — a plain click. */
function clickAt(element: Element, x = 10, y = 10, detail = 1) {
  element.dispatchEvent(
    // jsdom ships no PointerEvent; the listener only reads clientX/clientY
    new MouseEvent("pointerdown", { bubbles: true, clientX: x, clientY: y })
  );
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, clientX: x, clientY: y, detail })
  );
}

describe("inline code click-to-copy", () => {
  it("copies the text of an inline code span", () => {
    const { container } = render(
      <MarkdownPreview content="Usa `vote_open` para abrir." path="/tmp/a.md" />
    );
    const code = container.querySelector("p > code");
    expect(code).not.toBeNull();

    clickAt(code!);
    expect(writeText).toHaveBeenCalledWith("vote_open");
  });

  it("works for inline code inside a GFM table cell", () => {
    const content = ["| id | prompt |", "| --- | --- |", "| a | `low drone` |"].join("\n");
    const { container } = render(<MarkdownPreview content={content} path="/tmp/b.md" />);

    const code = container.querySelector("td code");
    expect(code).not.toBeNull();
    clickAt(code!);
    expect(writeText).toHaveBeenCalledWith("low drone");
  });

  it("does not fire for code inside a fenced block", () => {
    // Braces matter: a JSX string attribute would not expand the newlines
    const { container } = render(
      <MarkdownPreview content={"```\nconst a = 1;\n```"} path="/tmp/c.md" />
    );
    const code = container.querySelector("pre code");
    expect(code).not.toBeNull();

    clickAt(code!);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("does not copy when the pointer was dragged to select text", () => {
    const { container } = render(
      <MarkdownPreview content="Usa `vote_open` aquí." path="/tmp/d.md" />
    );
    const code = container.querySelector("p > code")!;

    code.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10 })
    );
    code.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 60, clientY: 10 })
    );

    expect(writeText).not.toHaveBeenCalled();
  });

  it("does not copy on a double click, which selects a word", () => {
    const { container } = render(
      <MarkdownPreview content="Usa `vote_open` aquí." path="/tmp/e.md" />
    );
    const code = container.querySelector("p > code")!;

    clickAt(code, 10, 10, 2);
    expect(writeText).not.toHaveBeenCalled();
  });
});
