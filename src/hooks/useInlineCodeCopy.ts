import { useEffect, type RefObject } from "react";

/** Pointer travel beyond this reads as a drag-select, not a click. */
const DRAG_SLOP_PX = 4;
const FEEDBACK_MS = 1200;

/**
 * Click-to-copy for inline code spans, via one delegated listener.
 *
 * Deliberately not a react-markdown component override: a long document holds
 * hundreds of code spans, and react-markdown rebuilds every component on each
 * re-parse. One listener on the container costs nothing and, unlike a component,
 * can tell inline code from a fenced block with certainty (`:not(pre) > code`).
 */
export function useInlineCodeCopy(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let downX = 0;
    let downY = 0;

    const handlePointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const code = target?.closest?.(":not(pre) > code") as HTMLElement | null;
      if (!code || !container.contains(code)) return;

      // Selecting text inside a chip must never copy: click still fires when
      // mousedown and mouseup share an ancestor, and so does double-click.
      if (event.detail > 1) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > DRAG_SLOP_PX) return;

      const text = code.textContent ?? "";
      if (!text) return;

      navigator.clipboard.writeText(text).then(
        () => {
          code.dataset.copied = "true";
          setTimeout(() => delete code.dataset.copied, FEEDBACK_MS);
        },
        (e: unknown) => console.error("[useInlineCodeCopy] Clipboard write failed:", e)
      );
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("click", handleClick);
    };
  }, [containerRef]);
}
