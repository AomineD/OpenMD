import { memo, useCallback, useMemo } from "react";
import { useDocumentStore } from "@/stores/documentStore";
import { useViewerStore, getViewerElement } from "@/stores/viewerStore";
import { parseOutlineCached, type OutlineHeading } from "@/lib/markdownOutline";
import { revealEditorLine } from "@/lib/editorBridge";
import { cn } from "@/lib/utils";

interface RowProps {
  heading: OutlineHeading;
  isActive: boolean;
  onSelect: (heading: OutlineHeading) => void;
}

/**
 * Memoized so that scrolling — which changes only the active slug — re-renders
 * two rows instead of the whole outline.
 */
const OutlineRow = memo(function OutlineRow({ heading, isActive, onSelect }: RowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      title={heading.text}
      onClick={() => onSelect(heading)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(heading);
        }
      }}
      style={{ paddingLeft: `${0.75 + (heading.level - 1) * 0.6}rem` }}
      className={cn(
        "flex items-center py-1 pr-2 cursor-pointer select-none border-l-2 transition-colors",
        isActive
          ? "border-cyan-400 bg-zinc-800 text-cyan-300"
          : "border-transparent text-slate-400 hover:bg-zinc-800 hover:text-slate-200"
      )}
    >
      <span className={cn("text-xs truncate", heading.level === 1 && "font-medium")}>
        {heading.text}
      </span>
    </div>
  );
});

export default function DocumentOutline() {
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const activeSlug = useViewerStore((s) => s.activeSlug);

  const activeDocument = documents.find((d) => d.id === activeDocumentId);
  const content = activeDocument?.content ?? "";
  const outline = useMemo(() => parseOutlineCached(content), [content]);

  const documentId = activeDocument?.id;
  const mode = activeDocument?.mode;

  // Stable identity keeps the memoized rows from re-rendering on every scroll
  const handleSelect = useCallback(
    (heading: OutlineHeading) => {
      if (!documentId) return;

      if (mode === "edit") {
        revealEditorLine(documentId, heading.line);
        return;
      }

      const container = getViewerElement();
      const target = document.getElementById(heading.slug);
      if (!container || !target) return;

      // Rect delta rather than offsetTop: .md-preview is position: static, so
      // the headings' offsetParent is <body>, not the scroll container.
      const top =
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;
      container.scrollTo({ top, behavior: "smooth" });
      useViewerStore.getState().setActiveSlug(heading.slug);
    },
    [documentId, mode]
  );

  if (!activeDocument) {
    return (
      <p className="text-slate-600 text-xs px-3 py-4 text-center select-none">No file open</p>
    );
  }

  if (outline.length === 0) {
    return (
      <p className="text-slate-600 text-xs px-3 py-4 text-center select-none">
        No headings in this document
      </p>
    );
  }

  return (
    <div>
      {outline.map((heading) => (
        <OutlineRow
          key={`${heading.slug}-${heading.line}`}
          heading={heading}
          isActive={heading.slug === activeSlug}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
