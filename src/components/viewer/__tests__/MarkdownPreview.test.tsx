import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import MarkdownPreview from "../MarkdownPreview";
import { parseOutline } from "@/lib/markdownOutline";

afterEach(cleanup);

/**
 * The outline panel navigates by anchor, so every slug the parser reports must
 * exist as an id in the rendered document. The two are kept in sync by source
 * line rather than by recomputing the slug, and this is what proves it.
 */
describe("MarkdownPreview heading anchors", () => {
  it("gives every parsed heading a matching id in the DOM", () => {
    const content = [
      "# Título principal",
      "",
      "Texto.",
      "",
      "## Con `código` y **negrita**",
      "",
      "### Con [un link](https://example.com)",
      "",
      "Setext",
      "======",
      "",
      "```",
      "# no es un encabezado",
      "```",
      "",
      "#### Último",
    ].join("\n");

    const outline = parseOutline(content);
    const { container } = render(<MarkdownPreview content={content} path="/tmp/a.md" />);

    expect(outline.length).toBe(5);
    for (const heading of outline) {
      expect(container.querySelector(`#${CSS.escape(heading.slug)}`)).not.toBeNull();
    }
  });

  it("does not render headings that live inside code fences", () => {
    const content = "# Real\n\n```\n# Fake\n```";
    const { container } = render(<MarkdownPreview content={content} path="/tmp/b.md" />);
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("Real");
  });

  it("keeps ids unique when heading text repeats", () => {
    const content = "## Setup\n\ntexto\n\n## Setup";
    const outline = parseOutline(content);
    const { container } = render(<MarkdownPreview content={content} path="/tmp/c.md" />);

    expect(outline.map((h) => h.slug)).toEqual(["setup", "setup-1"]);
    const ids = Array.from(container.querySelectorAll("h2")).map((h) => h.id);
    expect(ids).toEqual(["setup", "setup-1"]);
  });

  it("wraps fenced code blocks with a copy button", () => {
    const content = "```js\nconst a = 1;\n```";
    const { container } = render(<MarkdownPreview content={content} path="/tmp/d.md" />);

    const wrapper = container.querySelector(".md-codeblock");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector("pre")).not.toBeNull();
    expect(wrapper?.querySelector("button.md-copy-button")).not.toBeNull();
  });

  it("preserves the highlight classes rehype-highlight puts on the code element", () => {
    const content = "```js\nconst a = 1;\n```";
    const { container } = render(<MarkdownPreview content={content} path="/tmp/e.md" />);

    const code = container.querySelector("pre code");
    expect(code?.className).toContain("hljs");
    expect(code?.className).toContain("language-js");
  });
});
