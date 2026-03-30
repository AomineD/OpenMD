import { describe, it, expect, beforeEach, vi } from "vitest";
import { useHistoryStore } from "../historyStore";

vi.mock("@/lib/persistence", () => ({
  loadJSON: vi.fn().mockResolvedValue([]),
  saveJSON: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  useHistoryStore.setState({ recentFiles: [] });
});

describe("historyStore", () => {
  it("addRecent adds a new entry", async () => {
    await useHistoryStore.getState().addRecent({ path: "/a/file.md", fileName: "file.md" });
    expect(useHistoryStore.getState().recentFiles).toHaveLength(1);
    expect(useHistoryStore.getState().recentFiles[0].path).toBe("/a/file.md");
  });

  it("addRecent deduplicates by path (upserts lastOpenedAt)", async () => {
    await useHistoryStore.getState().addRecent({ path: "/a/file.md", fileName: "file.md" });
    const first = useHistoryStore.getState().recentFiles[0].lastOpenedAt;
    await new Promise((r) => setTimeout(r, 5));
    await useHistoryStore.getState().addRecent({ path: "/a/file.md", fileName: "file.md" });
    const state = useHistoryStore.getState();
    expect(state.recentFiles).toHaveLength(1);
    expect(state.recentFiles[0].lastOpenedAt).toBeGreaterThan(first);
  });

  it("addRecent prepends new entries", async () => {
    await useHistoryStore.getState().addRecent({ path: "/a.md", fileName: "a.md" });
    await useHistoryStore.getState().addRecent({ path: "/b.md", fileName: "b.md" });
    expect(useHistoryStore.getState().recentFiles[0].path).toBe("/b.md");
  });

  it("addRecent limits list to 20 entries", async () => {
    for (let i = 0; i < 25; i++) {
      await useHistoryStore
        .getState()
        .addRecent({ path: `/file${i}.md`, fileName: `file${i}.md` });
    }
    expect(useHistoryStore.getState().recentFiles).toHaveLength(20);
  });

  it("removeRecent filters by path", async () => {
    await useHistoryStore.getState().addRecent({ path: "/a.md", fileName: "a.md" });
    await useHistoryStore.getState().addRecent({ path: "/b.md", fileName: "b.md" });
    await useHistoryStore.getState().removeRecent("/a.md");
    const state = useHistoryStore.getState();
    expect(state.recentFiles).toHaveLength(1);
    expect(state.recentFiles[0].path).toBe("/b.md");
  });

  it("clearHistory empties the list", async () => {
    await useHistoryStore.getState().addRecent({ path: "/a.md", fileName: "a.md" });
    await useHistoryStore.getState().clearHistory();
    expect(useHistoryStore.getState().recentFiles).toHaveLength(0);
  });
});
