import { useRef, useState, type ComponentPropsWithoutRef, type RefObject } from "react";
import { Copy, Check } from "lucide-react";
import type { Components } from "react-markdown";

/**
 * The hast node react-markdown passes to every component override.
 * Declared locally: `@types/hast` is a transitive dependency and pnpm's strict
 * layout makes it unresolvable from application code.
 */
type WithNode = { node?: { position?: { start: { line: number } } } };

/**
 * Copies the rendered text of a fenced code block.
 *
 * The text has to come from the DOM: rehype-highlight has already replaced the
 * code with a tree of nested <span>, so `String(children)` yields garbage.
 */
function CodeBlock({ node: _node, children, ...props }: ComponentPropsWithoutRef<"pre"> & WithNode) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("[markdownComponents] Clipboard write failed:", e);
    }
  };

  return (
    <div className="md-codeblock">
      {/* The button is anchored to the wrapper, not to <pre>: <pre> scrolls
          horizontally and would drag an absolutely positioned child with it. */}
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="md-copy-button"
        aria-label={copied ? "Copied" : "Copy code"}
        title={copied ? "Copied" : "Copy code"}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

/**
 * Builds the heading overrides.
 *
 * Ids come from the outline parser, looked up by source line via the node
 * position react-markdown hands us. Deriving them from the rendered text would
 * mean a second slug pipeline that can silently drift from the first.
 */
function headingComponent(tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6", slugs: RefObject<Map<number, string>>) {
  return function Heading({ node, children, ...props }: ComponentPropsWithoutRef<"h1"> & WithNode) {
    const line = node?.position?.start.line;
    const id = line === undefined ? undefined : slugs.current.get(line);
    const Tag = tag;
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };
}

/**
 * Component overrides for the preview.
 *
 * Takes a ref rather than the map itself so the component identities stay
 * stable across content changes — swapping them would remount every heading.
 *
 * Inline code is deliberately absent: a long document holds hundreds of code
 * spans, and a component each would be rebuilt on every re-parse. It is handled
 * by a single delegated listener in MarkdownPreview instead.
 */
export function createMarkdownComponents(slugs: RefObject<Map<number, string>>): Components {
  return {
    pre: CodeBlock,
    h1: headingComponent("h1", slugs),
    h2: headingComponent("h2", slugs),
    h3: headingComponent("h3", slugs),
    h4: headingComponent("h4", slugs),
    h5: headingComponent("h5", slugs),
    h6: headingComponent("h6", slugs),
  };
}
