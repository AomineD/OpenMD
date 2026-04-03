import { useCallback } from "react";
import { exists } from "@tauri-apps/plugin-fs";
import { useDocumentStore } from "@/stores/documentStore";
import { readMarkdownFile } from "@/lib/fileOperations";

type RefreshResult = "refreshed" | "dirty" | "missing" | "error";

export function useRefreshDocuments() {
  const refreshContent = useDocumentStore((s) => s.refreshContent);
  const closeDocument = useDocumentStore((s) => s.closeDocument);

  const refreshSingleDocument = useCallback(
    async (docId: string): Promise<RefreshResult> => {
      const doc = useDocumentStore
        .getState()
        .documents.find((d) => d.id === docId);
      if (!doc) return "error";
      if (doc.isDirty) return "dirty";

      try {
        const fileExists = await exists(doc.path);
        if (!fileExists) {
          closeDocument(docId);
          return "missing";
        }
        const newContent = await readMarkdownFile(doc.path);
        if (newContent !== doc.content) {
          refreshContent(docId, newContent);
        }
        return "refreshed";
      } catch (e) {
        console.error("[useRefreshDocuments] Failed to refresh:", doc.path, e);
        return "error";
      }
    },
    [refreshContent, closeDocument]
  );

  const refreshAllDocuments = useCallback(async (): Promise<void> => {
    const docs = useDocumentStore.getState().documents;
    await Promise.allSettled(docs.map((doc) => refreshSingleDocument(doc.id)));
  }, [refreshSingleDocument]);

  const refreshActiveDocument = useCallback(async (): Promise<RefreshResult | "none"> => {
    const activeId = useDocumentStore.getState().activeDocumentId;
    if (!activeId) return "none";
    return refreshSingleDocument(activeId);
  }, [refreshSingleDocument]);

  return { refreshAllDocuments, refreshActiveDocument, refreshSingleDocument };
}
