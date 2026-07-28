import GithubSlugger from "github-slugger";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface OutlineHeading {
  /** Heading depth, 1 for `#` through 6 for `######` */
  level: HeadingLevel;
  /** Display label, stripped of inline Markdown syntax */
  text: string;
  /** Anchor id, unique within the document */
  slug: string;
  /**
   * 1-based source line where the heading starts.
   *
   * Matches remark's `position.start.line`, which is what lets MarkdownPreview
   * assign the very same slug to the rendered element without recomputing it.
   * For setext headings that is the text line, not the underline.
   */
  line: number;
}

/** Opening fence: up to 3 spaces of indent, then 3+ backticks or tildes. */
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
/** ATX heading. Indent of 4+ spaces would make it an indented code block instead. */
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
/** Closing `#`s of an ATX heading — `## Title ##` renders as "Title". */
const ATX_CLOSING = /[ \t]+#+[ \t]*$/;
/** Setext h1 underline. `-` is not supported: it is ambiguous with `hr` and front-matter. */
const SETEXT_H1 = /^ {0,3}={1,}[ \t]*$/;

/**
 * Removes inline Markdown syntax so the outline shows a clean label.
 * Order matters: images before links, code spans before emphasis.
 */
function stripInlineMarkdown(raw: string): string {
  return (
    raw
      // Images render as <img>, contributing no text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
      // Links keep their label
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
      // Code spans keep their content
      .replace(/`+([^`]*)`+/g, "$1")
      // Emphasis, strong and strikethrough
      .replace(/(\*\*\*|___)(.+?)\1/g, "$2")
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/(\*|_)(.+?)\1/g, "$2")
      .replace(/~~(.+?)~~/g, "$1")
      // Raw HTML is dropped by react-markdown (no rehype-raw), so drop the tags too
      .replace(/<[^>]+>/g, "")
      // Backslash escapes
      .replace(/\\([\\`*_{}[\]()#+\-.!~])/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Builds the regex that closes a fence opened with `marker`. */
function closingFence(marker: string): RegExp {
  const char = marker[0] === "`" ? "`" : "~";
  return new RegExp(`^ {0,3}${char}{${marker.length},}[ \\t]*$`);
}

/**
 * Extracts the heading outline from Markdown source.
 *
 * Deliberately parses the raw source rather than the rendered DOM so the outline
 * is available in edit mode too, and so every heading carries a source line.
 *
 * Ignores `#` that is not really a heading: inside fenced code blocks, inside
 * YAML front-matter and inside HTML comments. Indented code blocks need no
 * special handling — 4+ spaces of indent already fails the ATX pattern.
 */
export function parseOutline(markdown: string): OutlineHeading[] {
  const lines = markdown.split(/\r?\n/);
  const slugger = new GithubSlugger();
  const headings: OutlineHeading[] = [];

  const push = (level: HeadingLevel, raw: string, line: number): void => {
    const text = stripInlineMarkdown(raw);
    // A heading with no text content is useless in a table of contents
    if (text === "") return;
    headings.push({ level, text, slug: slugger.slug(text), line });
  };

  let index = 0;

  // YAML front-matter, only when it opens on the very first line
  if (lines[0] !== undefined && /^---[ \t]*$/.test(lines[0])) {
    let end = 1;
    while (end < lines.length && !/^(---|\.\.\.)[ \t]*$/.test(lines[end])) {
      end++;
    }
    // An unterminated block is not front-matter — parse the file normally
    if (end < lines.length) index = end + 1;
  }

  let fenceMarker: string | null = null;
  let inHtmlComment = false;

  for (; index < lines.length; index++) {
    const line = lines[index];

    if (inHtmlComment) {
      if (line.includes("-->")) inHtmlComment = false;
      continue;
    }

    if (fenceMarker) {
      if (closingFence(fenceMarker).test(line)) fenceMarker = null;
      continue;
    }

    const fence = line.match(FENCE_OPEN);
    // A backtick fence cannot carry backticks in its info string
    if (fence && !(fence[1][0] === "`" && fence[2].includes("`"))) {
      fenceMarker = fence[1];
      continue;
    }

    if (line.includes("<!--") && !line.includes("-->")) {
      inHtmlComment = true;
      continue;
    }

    const atx = line.match(ATX);
    if (atx) {
      push(atx[1].length as HeadingLevel, (atx[2] ?? "").replace(ATX_CLOSING, ""), index + 1);
      continue;
    }

    // Setext h1: a non-blank paragraph line followed by `===`
    if (SETEXT_H1.test(line) && index > 0) {
      const previous = lines[index - 1];
      if (previous.trim() !== "" && !ATX.test(previous) && !/^ {4,}/.test(previous)) {
        push(1, previous.trim(), index);
      }
    }
  }

  return headings;
}

const CACHE_LIMIT = 8;
const cache = new Map<string, OutlineHeading[]>();

/**
 * `parseOutline` memoized by content string.
 *
 * The preview needs the slugs to assign heading ids and the sidebar needs the
 * list; both would otherwise parse the same document independently.
 */
export function parseOutlineCached(markdown: string): OutlineHeading[] {
  const hit = cache.get(markdown);
  if (hit) return hit;

  const outline = parseOutline(markdown);
  cache.set(markdown, outline);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return outline;
}

/** Maps source line to slug, so the renderer can label headings by position. */
export function slugsByLine(outline: OutlineHeading[]): Map<number, string> {
  return new Map(outline.map((h) => [h.line, h.slug]));
}
