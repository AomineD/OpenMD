import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { exists } from "@tauri-apps/plugin-fs";
import type { OpenDocument, SessionData } from "./types";
import { SESSION_VERSION } from "./types";
import { extractFileName, readMarkdownFile } from "@/lib/fileOperations";
import { loadJSON, saveJSON } from "@/lib/persistence";
import { useViewerStore } from "./viewerStore";

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
  togglePin: (id: string) => void;
  saveSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

/**
 * Moves `id` so pinned documents always occupy the front of the array.
 *
 * Order is reordered physically rather than only at render time because
 * Ctrl+Tab cycles by array index and `closeDocument` picks the left neighbour
 * by index — if visual and array order diverged, both would misbehave.
 */
function reorderForPin(documents: OpenDocument[], id: string): OpenDocument[] {
  const moving = documents.find((doc) => doc.id === id);
  if (!moving) return documents;

  const rest = documents.filter((doc) => doc.id !== id);
  const pinnedCount = rest.filter((doc) => doc.isPinned).length;
  // Pinning appends to the pinned block; unpinning lands at the head of the
  // unpinned block, which keeps the tab next to where the eye already was.
  const insertAt = pinnedCount;

  return [...rest.slice(0, insertAt), moving, ...rest.slice(insertAt)];
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
          // Pinned tabs survive; the order-preserving filter keeps the
          // pinned-first invariant without re-sorting.
          documents: state.documents.filter((doc) => doc.id === id || doc.isPinned),
          activeDocumentId: id,
        }));
      },

      closeAllDocuments: () => {
        set((state) => {
          const survivors = state.documents.filter((doc) => doc.isPinned);
          if (survivors.length === 0) {
            return { documents: [], activeDocumentId: null };
          }
          // Keep the active tab if it survived, otherwise fall back to the first
          const stillActive = survivors.some((doc) => doc.id === state.activeDocumentId);
          return {
            documents: survivors,
            activeDocumentId: stillActive ? state.activeDocumentId : survivors[0].id,
          };
        });
      },

      togglePin: (id) => {
        set((state) => {
          const flipped = state.documents.map((doc) =>
            doc.id === id ? { ...doc, isPinned: !doc.isPinned } : doc
          );
          return { documents: reorderForPin(flipped, id) };
        });
        // Pinning is a deliberate, low-frequency act, and the session is
        // otherwise only written on blur — don't lose it if the app is killed.
        void get().saveSession();
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
        const { anchors } = useViewerStore.getState();
        const session: SessionData = {
          version: SESSION_VERSION,
          tabs: documents.map((d) => ({
            path: d.path,
            mode: d.mode,
            isPinned: d.isPinned,
            scrollTop: anchors[d.path]?.top,
          })),
          activeTabPath: activeDoc?.path ?? null,
        };
        await saveJSON("open-tabs.json", session);
      },

      restoreSession: async () => {
        const session = await loadJSON<SessionData>("open-tabs.json", {
          tabs: [],
          activeTabPath: null,
        });
        // Sessions written before versioning only ever gained optional fields,
        // so they load as-is. Anything unreadable already fell back above.
        if (!Array.isArray(session.tabs) || session.tabs.length === 0) return;

        const openedDocs: OpenDocument[] = [];
        const anchors: Record<string, { top: number; slug: null; offset: number }> = {};

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
              isPinned: tab.isPinned,
            });
            if (typeof tab.scrollTop === "number" && tab.scrollTop > 0) {
              anchors[tab.path] = { top: tab.scrollTop, slug: null, offset: 0 };
            }
          } catch (e) {
            console.error("[documentStore] Failed to restore tab:", tab.path, e);
          }
        }

        if (openedDocs.length === 0) return;

        // Re-establish the pinned-first invariant defensively: the file could
        // have been hand-edited into an interleaved order.
        const ordered = [
          ...openedDocs.filter((d) => d.isPinned),
          ...openedDocs.filter((d) => !d.isPinned),
        ];

        const activeDoc = session.activeTabPath
          ? ordered.find((d) => d.path === session.activeTabPath)
          : null;

        useViewerStore.getState().hydrateAnchors(anchors);
        set({
          documents: ordered,
          activeDocumentId: activeDoc?.id ?? ordered[0].id,
        });
      },
    }),
    {
      name: "document-store",
    }
  )
);
