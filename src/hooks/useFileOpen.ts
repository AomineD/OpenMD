import { useCallback } from "react";
import {
  openFileDialog,
  readMarkdownFile,
  normalizePath,
  extractFileName,
} from "@/lib/fileOperations";
import { useDocumentStore } from "@/stores/documentStore";
import { useHistoryStore } from "@/stores/historyStore";

export function useFileOpen() {
  const openDocument = useDocumentStore((state) => state.openDocument);
  const setActiveDocument = useDocumentStore((state) => state.setActiveDocument);
  const getDocumentByPath = useDocumentStore((state) => state.getDocumentByPath);

  /**
   * Opens a file by absolute path.
   * If the file is already open, focuses its tab instead of opening a duplicate.
   * Used by CLI args, single-instance events, and internal callers.
   */
  const openByPath = useCallback(
    async (rawPath: string) => {
      const path = normalizePath(rawPath);
      const existing = getDocumentByPath(path);

      if (existing) {
        // Duplicate: focus the existing tab
        setActiveDocument(existing.id);
        return;
      }

      try {
        const content = await readMarkdownFile(path);
        openDocument(path, content);
        useHistoryStore.getState().addRecent({ path, fileName: extractFileName(path) });
      } catch (error) {
        console.error(`[useFileOpen] Failed to read file "${path}":`, error);
      }
    },
    [getDocumentByPath, setActiveDocument, openDocument]
  );

  /**
   * Opens the native file picker dialog, then opens the selected file.
   * No-op if the user cancels the dialog.
   */
  const openFromDialog = useCallback(async () => {
    try {
      const path = await openFileDialog();
      if (!path) return; // User cancelled
      await openByPath(path);
    } catch (error) {
      console.error("[useFileOpen] Failed to open file from dialog:", error);
    }
  }, [openByPath]);

  return { openFromDialog, openByPath };
}
