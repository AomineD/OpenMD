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
}

export interface RecentDocument {
  /** Absolute normalized path */
  path: string;
  /** File name including extension */
  fileName: string;
  /** Unix timestamp of last open */
  lastOpenedAt: number;
}
