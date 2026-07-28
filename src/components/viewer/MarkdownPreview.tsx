import { memo, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "./markdownStyles.css";
import { createMarkdownComponents } from "./markdownComponents";
import { parseOutlineCached, slugsByLine } from "@/lib/markdownOutline";
import { usePreviewScroll } from "@/hooks/usePreviewScroll";
import { useInlineCodeCopy } from "@/hooks/useInlineCodeCopy";

interface MarkdownPreviewProps {
  content: string;
  /** Identifies the document for scroll persistence — paths outlive ids. */
  path: string;
}

function MarkdownPreview({ content, path }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const outline = useMemo(() => parseOutlineCached(content), [content]);

  // Read through a ref so the component identities never change: swapping them
  // would remount every heading on each content change.
  const slugsRef = useRef<Map<number, string>>(new Map());
  slugsRef.current = useMemo(() => slugsByLine(outline), [outline]);
  const components = useMemo(() => createMarkdownComponents(slugsRef), []);

  // react-markdown rebuilds its processor and re-parses on *every* render, so
  // the rendered tree has to be pinned to the content it came from.
  const rendered = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
        urlTransform={(url) => url}
      >
        {content}
      </ReactMarkdown>
    ),
    [content, components]
  );

  usePreviewScroll({ containerRef, contentRef, path, content, outline });
  useInlineCodeCopy(containerRef);

  return (
    <div ref={containerRef} className="md-preview overflow-y-auto h-full scrollbar-thin">
      <div ref={contentRef}>{rendered}</div>
    </div>
  );
}

export default memo(MarkdownPreview);
