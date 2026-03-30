import { useCallback } from "react";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import {
  writeMarkdownFile,
  normalizePath,
  extractFileName,
} from "@/lib/fileOperations";
import { useDocumentStore } from "@/stores/documentStore";

export function useSaveFile() {
  const documents = useDocumentStore((state) => state.documents);
  const markSaved = useDocumentStore((state) => state.markSaved);
  const updatePath = useDocumentStore((state) => state.updatePath);

  const saveDocument = useCallback(
    async (documentId: string) => {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc || !doc.isDirty) return;
      try {
        await writeMarkdownFile(doc.path, doc.content);
        markSaved(documentId);
      } catch (error) {
        console.error("[useSaveFile] Save failed:", error);
      }
    },
    [documents, markSaved]
  );

  const saveDocumentAs = useCallback(
    async (documentId: string) => {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc) return;
      try {
        const selectedPath = await saveDialog({
          defaultPath: doc.path,
          filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
        });
        if (!selectedPath) return; // user cancelled
        const normalized = normalizePath(selectedPath);
        await writeMarkdownFile(normalized, doc.content);
        updatePath(documentId, normalized, extractFileName(normalized));
        markSaved(documentId);
      } catch (error) {
        console.error("[useSaveFile] Save As failed:", error);
      }
    },
    [documents, markSaved, updatePath]
  );

  return { saveDocument, saveDocumentAs };
}
