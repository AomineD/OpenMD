import { describe, it, expect } from "vitest";
import { parseOutline } from "../markdownOutline";

describe("parseOutline", () => {
  it("extracts ATX headings with level, text and 1-based line", () => {
    const outline = parseOutline("# One\n\ntext\n\n## Two\n\n### Three");
    expect(outline).toEqual([
      { level: 1, text: "One", slug: "one", line: 1 },
      { level: 2, text: "Two", slug: "two", line: 5 },
      { level: 3, text: "Three", slug: "three", line: 7 },
    ]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const outline = parseOutline("# Real\n\n```\n# Fake\n```\n\n## Also real");
    expect(outline.map((h) => h.text)).toEqual(["Real", "Also real"]);
  });

  it("ignores headings inside tilde fences and fences with info strings", () => {
    const outline = parseOutline("~~~bash\n# not a heading\n~~~\n\n```js\n# nor this\n```\n\n# Yes");
    expect(outline.map((h) => h.text)).toEqual(["Yes"]);
  });

  it("only closes a fence with at least as many markers as opened it", () => {
    const outline = parseOutline("````\n```\n# still code\n````\n\n# Out");
    expect(outline.map((h) => h.text)).toEqual(["Out"]);
  });

  it("skips YAML front-matter", () => {
    const outline = parseOutline("---\ntitle: x\n# not a heading\n---\n\n# Real");
    expect(outline).toEqual([{ level: 1, text: "Real", slug: "real", line: 6 }]);
  });

  it("treats an unterminated front-matter block as normal content", () => {
    const outline = parseOutline("---\n# Heading anyway");
    expect(outline.map((h) => h.text)).toEqual(["Heading anyway"]);
  });

  it("ignores headings inside multi-line HTML comments", () => {
    const outline = parseOutline("<!--\n# hidden\n-->\n\n# Visible");
    expect(outline.map((h) => h.text)).toEqual(["Visible"]);
  });

  it("ignores indented code blocks", () => {
    const outline = parseOutline("text\n\n    # indented code\n\n# Real");
    expect(outline.map((h) => h.text)).toEqual(["Real"]);
  });

  it("strips closing hashes", () => {
    expect(parseOutline("## Title ##")[0].text).toBe("Title");
  });

  it("strips inline syntax from the label", () => {
    const outline = parseOutline(
      "# Uno `code` y **negrita**\n## Con [link](http://x) y _cursiva_\n### ~~tachado~~ fin"
    );
    expect(outline.map((h) => h.text)).toEqual([
      "Uno code y negrita",
      "Con link y cursiva",
      "tachado fin",
    ]);
  });

  it("gives duplicate headings distinct slugs", () => {
    const outline = parseOutline("# Setup\n# Setup\n# Setup");
    expect(outline.map((h) => h.slug)).toEqual(["setup", "setup-1", "setup-2"]);
  });

  it("recognises setext h1 and reports the text line", () => {
    const outline = parseOutline("Title\n=====\n\n# Other");
    expect(outline).toEqual([
      { level: 1, text: "Title", slug: "title", line: 1 },
      { level: 1, text: "Other", slug: "other", line: 4 },
    ]);
  });

  it("skips headings with no text content", () => {
    expect(parseOutline("#\n\n##   \n\n# Real").map((h) => h.text)).toEqual(["Real"]);
  });

  it("requires a space after the hashes", () => {
    expect(parseOutline("#NoSpace\n\n#hashtag").length).toBe(0);
  });

  it("ignores hashes indented by four or more spaces", () => {
    expect(parseOutline("     # deep").length).toBe(0);
  });

  it("handles CRLF line endings", () => {
    const outline = parseOutline("# One\r\n\r\n## Two");
    expect(outline.map((h) => [h.text, h.line])).toEqual([
      ["One", 1],
      ["Two", 3],
    ]);
  });

  it("returns an empty array for content without headings", () => {
    expect(parseOutline("just a paragraph\n\nand another")).toEqual([]);
  });
});
