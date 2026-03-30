import { create } from "zustand";
import type { RecentDocument } from "./types";
import { loadJSON, saveJSON } from "@/lib/persistence";

const MAX_RECENT = 20;

interface HistoryState {
  recentFiles: RecentDocument[];
  addRecent: (doc: Pick<RecentDocument, "path" | "fileName">) => Promise<void>;
  removeRecent: (path: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadFromDisk: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  recentFiles: [],

  addRecent: async ({ path, fileName }) => {
    const entry: RecentDocument = { path, fileName, lastOpenedAt: Date.now() };
    const filtered = get().recentFiles.filter((r) => r.path !== path);
    const newList = [entry, ...filtered].slice(0, MAX_RECENT);
    set({ recentFiles: newList });
    await saveJSON("recent-files.json", newList);
  },

  removeRecent: async (path) => {
    const newList = get().recentFiles.filter((r) => r.path !== path);
    set({ recentFiles: newList });
    await saveJSON("recent-files.json", newList);
  },

  clearHistory: async () => {
    set({ recentFiles: [] });
    await saveJSON("recent-files.json", []);
  },

  loadFromDisk: async () => {
    const recentFiles = await loadJSON<RecentDocument[]>("recent-files.json", []);
    set({ recentFiles });
  },
}));
