export interface OpenDocument {
  /** Unique identifier — generated via crypto.randomUUID() */
  id: string;
  /** Absolute normalized Windows path (forward slashes) */
  path: string;
  /** File name extracted from path, including extension */
  fileName: string;
  /** Full text content read from disk */
  content: string;
  /** Current interaction mode */
  mode: "view" | "edit";
  /** True when in-memory content differs from disk */
  isDirty: boolean;
  /** Unix timestamp of last successful save */
  lastSavedAt?: number;
  /** Unix timestamp when document was opened in this session */
  openedAt: number;
  /**
   * Pinned tabs sort ahead of the rest, cannot be closed from the UI and
   * survive "Close All" / "Close Others". Optional so older sessions load.
   */
  isPinned?: boolean;
}

export interface RecentDocument {
  /** Absolute normalized path */
  path: string;
  /** File name including extension */
  fileName: string;
  /** Unix timestamp of last open */
  lastOpenedAt: number;
}

export interface SessionTab {
  path: string;
  mode: "view" | "edit";
  isPinned?: boolean;
  /** Scroll offset in the preview, so reading position survives a restart */
  scrollTop?: number;
}

export interface SessionData {
  /**
   * Schema version. Absent means the pre-versioning shape, which is
   * forward-compatible: every field added since is optional.
   */
  version?: number;
  tabs: SessionTab[];
  activeTabPath: string | null;
}

export const SESSION_VERSION = 1;
