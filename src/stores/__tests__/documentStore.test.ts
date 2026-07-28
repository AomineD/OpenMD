import { describe, it, expect, beforeEach } from "vitest";
import { useDocumentStore } from "../documentStore";

beforeEach(() => {
  useDocumentStore.setState({ documents: [], activeDocumentId: null });
});

describe("documentStore", () => {
  it("openDocument adds to documents and sets activeDocumentId", () => {
    useDocumentStore.getState().openDocument("/test/file.md", "# Hello");
    const state = useDocumentStore.getState();
    expect(state.documents).toHaveLength(1);
    expect(state.documents[0].fileName).toBe("file.md");
    expect(state.documents[0].content).toBe("# Hello");
    expect(state.documents[0].isDirty).toBe(false);
    expect(state.activeDocumentId).toBe(state.documents[0].id);
  });

  it("getDocumentByPath finds by normalized path", () => {
    useDocumentStore.getState().openDocument("/test/file.md", "# Hello");
    const found = useDocumentStore.getState().getDocumentByPath("/test/file.md");
    expect(found).toBeDefined();
    expect(found!.fileName).toBe("file.md");
  });

  it("closeDocument removes the document", () => {
    useDocumentStore.getState().openDocument("/test/file.md", "# Hello");
    const id = useDocumentStore.getState().activeDocumentId!;
    useDocumentStore.getState().closeDocument(id);
    expect(useDocumentStore.getState().documents).toHaveLength(0);
    expect(useDocumentStore.getState().activeDocumentId).toBeNull();
  });

  it("closeDocument activates adjacent tab after close", () => {
    useDocumentStore.getState().openDocument("/test/a.md", "A");
    useDocumentStore.getState().openDocument("/test/b.md", "B");
    const idB = useDocumentStore.getState().activeDocumentId!;
    useDocumentStore.getState().closeDocument(idB);
    const remaining = useDocumentStore.getState().documents;
    expect(remaining).toHaveLength(1);
    expect(useDocumentStore.getState().activeDocumentId).toBe(remaining[0].id);
  });

  it("closeOtherDocuments retains only the target", () => {
    useDocumentStore.getState().openDocument("/test/a.md", "A");
    useDocumentStore.getState().openDocument("/test/b.md", "B");
    useDocumentStore.getState().openDocument("/test/c.md", "C");
    const idB = useDocumentStore.getState().documents[1].id;
    useDocumentStore.getState().closeOtherDocuments(idB);
    expect(useDocumentStore.getState().documents).toHaveLength(1);
    expect(useDocumentStore.getState().documents[0].id).toBe(idB);
  });

  it("updateContent sets isDirty to true", () => {
    useDocumentStore.getState().openDocument("/test/file.md", "# Hello");
    const id = useDocumentStore.getState().activeDocumentId!;
    useDocumentStore.getState().updateContent(id, "# Hello World");
    expect(useDocumentStore.getState().documents[0].isDirty).toBe(true);
    expect(useDocumentStore.getState().documents[0].content).toBe("# Hello World");
  });

  it("markSaved clears isDirty", () => {
    useDocumentStore.getState().openDocument("/test/file.md", "# Hello");
    const id = useDocumentStore.getState().activeDocumentId!;
    useDocumentStore.getState().updateContent(id, "# Hello World");
    useDocumentStore.getState().markSaved(id);
    expect(useDocumentStore.getState().documents[0].isDirty).toBe(false);
  });

  describe("pinned tabs", () => {
    const openThree = () => {
      const store = useDocumentStore.getState();
      store.openDocument("/test/a.md", "A");
      store.openDocument("/test/b.md", "B");
      store.openDocument("/test/c.md", "C");
      return useDocumentStore.getState().documents.map((d) => d.id);
    };

    const names = () =>
      useDocumentStore.getState().documents.map((d) => d.fileName);

    it("togglePin moves the tab to the end of the pinned block", () => {
      const [, , idC] = openThree();
      useDocumentStore.getState().togglePin(idC);
      expect(names()).toEqual(["c.md", "a.md", "b.md"]);
      expect(useDocumentStore.getState().documents[0].isPinned).toBe(true);
    });

    it("keeps pinned tabs in pin order when several are pinned", () => {
      const [, idB, idC] = openThree();
      useDocumentStore.getState().togglePin(idC);
      useDocumentStore.getState().togglePin(idB);
      expect(names()).toEqual(["c.md", "b.md", "a.md"]);
    });

    it("unpinning lands at the head of the unpinned block, not at the end", () => {
      const [idA, idB, idC] = openThree();
      useDocumentStore.getState().togglePin(idA);
      useDocumentStore.getState().togglePin(idB);
      // pinned: a, b — unpinned: c
      useDocumentStore.getState().togglePin(idA);
      expect(names()).toEqual(["b.md", "a.md", "c.md"]);
      expect(useDocumentStore.getState().documents[1].isPinned).toBe(false);
      expect(idC).toBeDefined();
    });

    it("does not change the active document when pinning", () => {
      const [idA] = openThree();
      const activeBefore = useDocumentStore.getState().activeDocumentId;
      useDocumentStore.getState().togglePin(idA);
      expect(useDocumentStore.getState().activeDocumentId).toBe(activeBefore);
    });

    it("closeAllDocuments keeps pinned tabs", () => {
      const [idA] = openThree();
      useDocumentStore.getState().togglePin(idA);
      useDocumentStore.getState().closeAllDocuments();
      expect(names()).toEqual(["a.md"]);
      expect(useDocumentStore.getState().activeDocumentId).toBe(idA);
    });

    it("closeAllDocuments still clears everything when nothing is pinned", () => {
      openThree();
      useDocumentStore.getState().closeAllDocuments();
      expect(useDocumentStore.getState().documents).toHaveLength(0);
      expect(useDocumentStore.getState().activeDocumentId).toBeNull();
    });

    it("closeOtherDocuments keeps pinned tabs plus the target", () => {
      const [idA, , idC] = openThree();
      useDocumentStore.getState().togglePin(idA);
      // order is now a, b, c
      useDocumentStore.getState().closeOtherDocuments(idC);
      expect(names()).toEqual(["a.md", "c.md"]);
      expect(useDocumentStore.getState().activeDocumentId).toBe(idC);
    });
  });
});
