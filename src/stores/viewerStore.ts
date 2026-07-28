import { create } from "zustand";

/**
 * Where the reader was inside a document.
 *
 * `top` alone survives tab switches and restarts. `slug` + `offset` is what
 * survives the content being replaced underneath the reader by an auto-refresh:
 * pixels shift when a section above is rewritten, a heading anchor does not.
 */
export interface ScrollAnchor {
  top: number;
  slug: string | null;
  offset: number;
}

interface ViewerState {
  /** Keyed by document `path` — ids are regenerated on every session restore. */
  anchors: Record<string, ScrollAnchor>;
  /** Slug of the heading currently at the top of the viewport. */
  activeSlug: string | null;
  setAnchor: (path: string, anchor: ScrollAnchor) => void;
  setActiveSlug: (slug: string | null) => void;
  /** Seeds saved positions from the persisted session. */
  hydrateAnchors: (anchors: Record<string, ScrollAnchor>) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  anchors: {},
  activeSlug: null,

  setAnchor: (path, anchor) => {
    set((state) => ({ anchors: { ...state.anchors, [path]: anchor } }));
  },

  setActiveSlug: (slug) => {
    set({ activeSlug: slug });
  },

  hydrateAnchors: (anchors) => {
    // Live positions win: the session file is only a cold-start seed
    set((state) => ({ anchors: { ...anchors, ...state.anchors } }));
  },
}));

/**
 * The preview's scroll container, kept outside the store on purpose.
 *
 * Putting a DOM node in reactive state would re-render every subscriber on
 * mount, and MarkdownPreview must never re-render from viewer state: react-markdown
 * re-parses and re-highlights the whole document on every single render.
 */
let viewerElement: HTMLElement | null = null;

export function setViewerElement(element: HTMLElement | null): void {
  viewerElement = element;
}

export function getViewerElement(): HTMLElement | null {
  return viewerElement;
}
