import { useDocumentStore } from "@/stores/documentStore";

export default function StatusBar() {
  const documents = useDocumentStore((state) => state.documents);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  return (
    <footer className="h-6 flex items-center px-3 bg-zinc-900 border-t border-zinc-800 shrink-0">
      <div className="flex items-center gap-3 text-xs select-none w-full">
        {activeDoc ? (
          <>
            <span className="text-cyan-400 uppercase tracking-wide font-medium">
              {activeDoc.mode === "view" ? "View" : "Edit"}
            </span>
            <span className="text-zinc-700">|</span>
            <span
              className="text-slate-500 truncate max-w-xs"
              title={activeDoc.path}
            >
              {activeDoc.path}
            </span>
            <span className="text-zinc-700">|</span>
            <span
              className={activeDoc.isDirty ? "text-amber-400" : "text-slate-600"}
            >
              {activeDoc.isDirty ? "Unsaved" : "Saved"}
            </span>
          </>
        ) : (
          <span className="text-cyan-400">Ready</span>
        )}
        <span className="text-zinc-700 ml-auto">v1.0.0</span>
      </div>
    </footer>
  );
}
