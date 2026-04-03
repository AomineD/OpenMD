import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { exists } from "@tauri-apps/plugin-fs";
import type { OpenDocument, SessionData } from "./types";
import { extractFileName, readMarkdownFile } from "@/lib/fileOperations";
import { loadJSON, saveJSON } from "@/lib/persistence";

interface DocumentState {
  documents: OpenDocument[];
  activeDocumentId: string | null;

  // Actions
  openDocument: (path: string, content: string) => void;
  closeDocument: (id: string) => void;
  closeOtherDocuments: (id: string) => void;
  closeAllDocuments: () => void;
  setActiveDocument: (id: string) => void;
  getDocumentByPath: (path: string) => OpenDocument | undefined;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
  setMode: (id: string, mode: "view" | "edit") => void;
  updatePath: (id: string, path: string, fileName: string) => void;
  refreshContent: (id: string, content: string) => void;
  saveSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>()(
  devtools(
    (set, get) => ({
      documents: [],
      activeDocumentId: null,

      openDocument: (path, content) => {
        const newDoc: OpenDocument = {
          id: crypto.randomUUID(),
          path,
          fileName: extractFileName(path),
          content,
          mode: "view",
          isDirty: false,
          openedAt: Date.now(),
        };

        set((state) => ({
          documents: [...state.documents, newDoc],
          activeDocumentId: newDoc.id,
        }));
      },

      closeDocument: (id) => {
        set((state) => {
          const index = state.documents.findIndex((doc) => doc.id === id);
          const remaining = state.documents.filter((doc) => doc.id !== id);

          // Determine next active document after closing
          let nextActiveId: string | null = null;
          if (state.activeDocumentId === id && remaining.length > 0) {
            // Activate the document to the left, or the new last if at end
            const nextIndex = Math.min(index, remaining.length - 1);
            nextActiveId = remaining[nextIndex]?.id ?? null;
          } else if (state.activeDocumentId !== id) {
            nextActiveId = state.activeDocumentId;
          }

          return {
            documents: remaining,
            activeDocumentId: nextActiveId,
          };
        });
      },

      closeOtherDocuments: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id === id),
          activeDocumentId: id,
        }));
      },

      closeAllDocuments: () => {
        set({ documents: [], activeDocumentId: null });
      },

      setActiveDocument: (id) => {
        set({ activeDocumentId: id });
      },

      getDocumentByPath: (path) => {
        return get().documents.find((doc) => doc.path === path);
      },

      updateContent: (id, content) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, content, isDirty: true } : doc
          ),
        }));
      },

      markSaved: (id) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? { ...doc, isDirty: false, lastSavedAt: Date.now() }
              : doc
          ),
        }));
      },

      setMode: (id, mode) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, mode } : doc
          ),
        }));
      },

      updatePath: (id, path, fileName) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, path, fileName } : doc
          ),
        }));
      },

      refreshContent: (id, content) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, content } : doc
          ),
        }));
      },

      saveSession: async () => {
        const { documents, activeDocumentId } = get();
        const activeDoc = documents.find((d) => d.id === activeDocumentId);
        const session: SessionData = {
          tabs: documents.map((d) => ({ path: d.path, mode: d.mode })),
          activeTabPath: activeDoc?.path ?? null,
        };
        await saveJSON("open-tabs.json", session);
      },

      restoreSession: async () => {
        const session = await loadJSON<SessionData>("open-tabs.json", {
          tabs: [],
          activeTabPath: null,
        });
        if (session.tabs.length === 0) return;

        const openedDocs: OpenDocument[] = [];

        for (const tab of session.tabs) {
          try {
            const fileExists = await exists(tab.path);
            if (!fileExists) continue;
            const content = await readMarkdownFile(tab.path);
            openedDocs.push({
              id: crypto.randomUUID(),
              path: tab.path,
              fileName: extractFileName(tab.path),
              content,
              mode: tab.mode,
              isDirty: false,
              openedAt: Date.now(),
            });
          } catch (e) {
            console.error("[documentStore] Failed to restore tab:", tab.path, e);
          }
        }

        if (openedDocs.length === 0) return;

        const activeDoc = session.activeTabPath
          ? openedDocs.find((d) => d.path === session.activeTabPath)
          : null;

        set({
          documents: openedDocs,
          activeDocumentId: activeDoc?.id ?? openedDocs[0].id,
        });
      },
    }),
    {
      name: "document-store",
    }
  )
);
