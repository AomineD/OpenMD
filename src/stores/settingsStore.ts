import { create } from "zustand";
import { loadJSON, saveJSON } from "@/lib/persistence";

export interface AppSettings {
  theme: "dark-futuristic";
  autoSaveEnabled: boolean;
  autoSaveIntervalSeconds: number;
  checkUpdatesOnStartup: boolean;
  sidebarVisible: boolean;
  /** Which panel the sidebar shows: recent files or the document outline */
  sidebarPanel: "recent" | "outline";
  wordWrap: boolean;
  fontSizeEditor: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark-futuristic",
  autoSaveEnabled: false,
  autoSaveIntervalSeconds: 10,
  checkUpdatesOnStartup: true,
  sidebarVisible: true,
  sidebarPanel: "recent",
  wordWrap: true,
  fontSizeEditor: 14,
};

interface SettingsState {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  loadFromDisk: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  setSetting: async (key, value) => {
    const newSettings = { ...get().settings, [key]: value };
    set({ settings: newSettings });
    await saveJSON("settings.json", newSettings);
  },

  loadFromDisk: async () => {
    const loaded = await loadJSON<Partial<AppSettings>>("settings.json", {});
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...loaded };
    set({ settings });
  },
}));
