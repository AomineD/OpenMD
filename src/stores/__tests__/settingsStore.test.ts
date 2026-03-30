import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore, DEFAULT_SETTINGS } from "../settingsStore";

const { mockSaveJSON } = vi.hoisted(() => ({
  mockSaveJSON: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/persistence", () => ({
  loadJSON: vi.fn().mockResolvedValue({}),
  saveJSON: mockSaveJSON,
}));

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  mockSaveJSON.mockClear();
});

describe("settingsStore", () => {
  it("DEFAULT_SETTINGS has expected values", () => {
    expect(DEFAULT_SETTINGS.theme).toBe("dark-futuristic");
    expect(DEFAULT_SETTINGS.autoSaveEnabled).toBe(false);
    expect(DEFAULT_SETTINGS.autoSaveIntervalSeconds).toBe(10);
    expect(DEFAULT_SETTINGS.checkUpdatesOnStartup).toBe(true);
    expect(DEFAULT_SETTINGS.sidebarVisible).toBe(true);
    expect(DEFAULT_SETTINGS.wordWrap).toBe(true);
    expect(DEFAULT_SETTINGS.fontSizeEditor).toBe(14);
  });

  it("setSetting updates the specified key", async () => {
    await useSettingsStore.getState().setSetting("wordWrap", false);
    expect(useSettingsStore.getState().settings.wordWrap).toBe(false);
  });

  it("setSetting calls saveJSON", async () => {
    await useSettingsStore.getState().setSetting("autoSaveEnabled", true);
    expect(mockSaveJSON).toHaveBeenCalledWith(
      "settings.json",
      expect.objectContaining({ autoSaveEnabled: true })
    );
  });

  it("setSetting does not mutate other keys", async () => {
    await useSettingsStore.getState().setSetting("fontSizeEditor", 18);
    const settings = useSettingsStore.getState().settings;
    expect(settings.fontSizeEditor).toBe(18);
    expect(settings.wordWrap).toBe(DEFAULT_SETTINGS.wordWrap);
    expect(settings.autoSaveEnabled).toBe(DEFAULT_SETTINGS.autoSaveEnabled);
  });

  it("loadFromDisk merges with DEFAULT_SETTINGS", async () => {
    const { loadJSON } = await import("@/lib/persistence");
    vi.mocked(loadJSON).mockResolvedValueOnce({ wordWrap: false });
    await useSettingsStore.getState().loadFromDisk();
    const settings = useSettingsStore.getState().settings;
    expect(settings.wordWrap).toBe(false);
    // Keys not in the loaded object should keep defaults
    expect(settings.autoSaveEnabled).toBe(DEFAULT_SETTINGS.autoSaveEnabled);
    expect(settings.fontSizeEditor).toBe(DEFAULT_SETTINGS.fontSizeEditor);
  });
});
