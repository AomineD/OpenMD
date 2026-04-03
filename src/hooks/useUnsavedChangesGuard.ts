import { useCallback, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocumentStore } from "@/stores/documentStore";
import { useSaveFile } from "./useSaveFile";
import { useHistoryStore } from "@/stores/historyStore";
import { saveWindowState } from "@/hooks/useWindowState";

export type UnsavedDialogState =
  | { open: false }
  | {
      open: true;
      documentId: string;
      fileName: string;
      resolve: (result: "save" | "discard" | "cancel") => void;
    };

export function useUnsavedChangesGuard() {
  const [dialogState, setDialogState] = useState<UnsavedDialogState>({
    open: false,
  });
  const closeDocument = useDocumentStore((state) => state.closeDocument);
  const documents = useDocumentStore((state) => state.documents);
  const { saveDocument } = useSaveFile();

  const promptForDocument = useCallback(
    (
      documentId: string,
      fileName: string
    ): Promise<"save" | "discard" | "cancel"> => {
      return new Promise((resolve) => {
        setDialogState({ open: true, documentId, fileName, resolve });
      });
    },
    []
  );

  const handleDialogResult = useCallback(
    async (result: "save" | "discard" | "cancel") => {
      if (!dialogState.open) return;
      const { documentId, resolve } = dialogState;
      setDialogState({ open: false });
      if (result === "save") {
        await saveDocument(documentId);
      }
      resolve(result);
    },
    [dialogState, saveDocument]
  );

  const guardedCloseDocument = useCallback(
    async (documentId: string) => {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc) return;
      if (!doc.isDirty) {
        useHistoryStore.getState().addRecent({ path: doc.path, fileName: doc.fileName });
        closeDocument(documentId);
        return;
      }
      const result = await promptForDocument(documentId, doc.fileName);
      if (result === "cancel") return;
      useHistoryStore.getState().addRecent({ path: doc.path, fileName: doc.fileName });
      closeDocument(documentId);
    },
    [documents, closeDocument, promptForDocument]
  );

  const guardWindowClose = useCallback(async () => {
    const dirtyDocs = documents.filter((d) => d.isDirty);
    for (const doc of dirtyDocs) {
      const result = await promptForDocument(doc.id, doc.fileName);
      if (result === "cancel") return; // abort window close
      if (result === "save") {
        await saveDocument(doc.id);
      }
      // 'discard': continue to next
    }
    // All resolved — save session, window state, and close
    await useDocumentStore.getState().saveSession();
    await saveWindowState();
    const appWindow = getCurrentWindow();
    await appWindow.destroy();
  }, [documents, promptForDocument, saveDocument]);

  return {
    dialogState,
    handleDialogResult,
    guardedCloseDocument,
    guardWindowClose,
  };
}
