import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { OutlineHeading } from "@/lib/markdownOutline";
import {
  setViewerElement,
  useViewerStore,
  type ScrollAnchor,
} from "@/stores/viewerStore";

const EMPTY_ANCHOR: ScrollAnchor = { top: 0, slug: null, offset: 0 };
/** How long after a restore we keep re-applying it as late layout settles. */
const SETTLE_MS = 600;
/** Trailing delay before the live position reaches the store. */
const PERSIST_MS = 250;

interface HeadingOffset {
  slug: string;
  top: number;
}

interface Options {
  /** The scrolling element. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** The element wrapping the rendered Markdown, watched for late growth. */
  contentRef: RefObject<HTMLDivElement | null>;
  path: string;
  content: string;
  outline: OutlineHeading[];
}

/**
 * Keeps the preview's reading position stable and tracks the heading in view.
 *
 * Three separate problems share one mechanism here:
 *   - switching tabs reuses the same DOM node, so the position must be restored
 *   - an auto-refresh swaps the content underneath the reader
 *   - a restart has to bring the position back from disk
 *
 * Nothing in here subscribes to the store: react-markdown re-parses and
 * re-highlights the entire document on every render, so a re-render per scroll
 * frame would be catastrophic on a long file.
 */
export function usePreviewScroll({
  containerRef,
  contentRef,
  path,
  content,
  outline,
}: Options) {
  const outlineRef = useRef(outline);
  outlineRef.current = outline;

  const offsetsRef = useRef<HeadingOffset[]>([]);
  const anchorRef = useRef<ScrollAnchor>(EMPTY_ANCHOR);
  /** Latest scrollTop, recorded synchronously so a flush never lags a frame. */
  const rawTopRef = useRef(0);
  const pathRef = useRef(path);
  const initializedRef = useRef(false);
  const restoringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Caches every heading's offset once, so scrolling never reads layout. */
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    const scrollTop = container.scrollTop;

    const offsets: HeadingOffset[] = [];
    for (const heading of outlineRef.current) {
      const element = document.getElementById(heading.slug);
      if (!element || !container.contains(element)) continue;
      offsets.push({
        slug: heading.slug,
        top: element.getBoundingClientRect().top - containerTop + scrollTop,
      });
    }
    offsetsRef.current = offsets;
  }, [containerRef]);

  /** Last heading at or above `scrollTop`, via binary search over the cache. */
  const locate = useCallback((scrollTop: number): { slug: string | null; offset: number } => {
    const offsets = offsetsRef.current;
    if (offsets.length === 0) return { slug: null, offset: scrollTop };

    const probe = scrollTop + 4;
    let low = 0;
    let high = offsets.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (offsets[mid].top <= probe) {
        found = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    if (found === -1) return { slug: null, offset: scrollTop };
    return { slug: offsets[found].slug, offset: scrollTop - offsets[found].top };
  }, []);

  /**
   * Commits the newest scroll position, even if its animation frame is still
   * pending — switching tabs right after scrolling would otherwise save a
   * position one frame out of date.
   */
  const flush = useCallback(() => {
    if (rafRef.current === null) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const top = rawTopRef.current;
    anchorRef.current = { top, ...locate(top) };
  }, [locate]);

  const persist = useCallback(
    (targetPath: string) => {
      flush();
      useViewerStore.getState().setAnchor(targetPath, anchorRef.current);
    },
    [flush]
  );

  const restore = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const anchor = anchorRef.current;
    let target = anchor.top;
    if (anchor.slug) {
      const match = offsetsRef.current.find((o) => o.slug === anchor.slug);
      // The anchored heading survived the rewrite — the pixels above it may not
      if (match) target = match.top + anchor.offset;
    }

    const max = Math.max(0, container.scrollHeight - container.clientHeight);
    restoringRef.current = true;
    container.scrollTop = Math.max(0, Math.min(target, max));
  }, [containerRef]);

  // Scroll tracking. Registered once; everything it needs lives in refs.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setViewerElement(container);

    const handleScroll = () => {
      // Ignore the scroll events our own restore produces, and the ones the
      // browser emits when it clamps a shortened document.
      if (restoringRef.current) return;
      rawTopRef.current = container.scrollTop;
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const element = containerRef.current;
        if (!element) return;

        const top = element.scrollTop;
        const { slug, offset } = locate(top);
        anchorRef.current = { top, slug, offset };

        const store = useViewerStore.getState();
        if (store.activeSlug !== slug) store.setActiveSlug(slug);

        if (persistTimerRef.current === null) {
          persistTimerRef.current = setTimeout(() => {
            persistTimerRef.current = null;
            persist(pathRef.current);
          }, PERSIST_MS);
        }
      });
    };

    // Only real user intent ends the restore window. Counting animation frames
    // would be guesswork: the number of scroll events a clamp produces varies.
    const cancelRestore = () => {
      restoringRef.current = false;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("wheel", cancelRestore, { passive: true });
    container.addEventListener("touchstart", cancelRestore, { passive: true });
    container.addEventListener("pointerdown", cancelRestore);
    container.addEventListener("keydown", cancelRestore);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", cancelRestore);
      container.removeEventListener("touchstart", cancelRestore);
      container.removeEventListener("pointerdown", cancelRestore);
      container.removeEventListener("keydown", cancelRestore);
      if (persistTimerRef.current !== null) clearTimeout(persistTimerRef.current);
      persist(pathRef.current);
      setViewerElement(null);
    };
  }, [containerRef, locate, persist]);

  // Re-measure and restore whenever the document or its content changes.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      anchorRef.current = useViewerStore.getState().anchors[path] ?? EMPTY_ANCHOR;
    } else if (pathRef.current !== path) {
      // Hand the outgoing document its final position before switching
      persist(pathRef.current);
      anchorRef.current = useViewerStore.getState().anchors[path] ?? EMPTY_ANCHOR;
    }
    pathRef.current = path;

    measure();
    restore();

    // Images carry no intrinsic size, so the document keeps growing after this
    // effect runs. Re-apply while it settles, then stop and stay out of the way.
    const deadline = Date.now() + SETTLE_MS;
    const observer = new ResizeObserver(() => {
      if (!restoringRef.current || Date.now() > deadline) return;
      measure();
      restore();
    });
    if (contentRef.current) observer.observe(contentRef.current);

    const settleTimer = setTimeout(() => {
      restoringRef.current = false;
      measure();
    }, SETTLE_MS);

    return () => {
      observer.disconnect();
      clearTimeout(settleTimer);
    };
  }, [path, content, containerRef, contentRef, measure, restore, persist]);
}
