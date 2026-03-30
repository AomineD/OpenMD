import { useDocumentStore } from "@/stores/documentStore";
import MarkdownPreview from "@/components/viewer/MarkdownPreview";
import MonacoEditor from "@/components/editor/MonacoEditor";
import EditFAB from "@/components/viewer/EditFAB";
import PlanFAB from "@/components/viewer/PlanFAB";

export default function MainContent() {
  const documents = useDocumentStore((state) => state.documents);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);

  const activeDocument = documents.find((doc) => doc.id === activeDocumentId);

  if (!activeDocument) {
    return (
      <main className="flex-1 overflow-hidden bg-zinc-950 flex items-center justify-center">
        <div className="text-center select-none space-y-3">
          <div className="text-8xl font-black text-cyan-400/15 tracking-tighter leading-none">
            MD
          </div>
          <p className="text-slate-500 text-sm font-medium">No file open</p>
          <p className="text-slate-700 text-xs">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-slate-400 font-mono text-xs">
              Ctrl+O
            </kbd>{" "}
            to open a Markdown file
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden bg-zinc-950">
      {activeDocument.mode === "view" ? (
        <MarkdownPreview content={activeDocument.content} />
      ) : (
        <MonacoEditor
          documentId={activeDocument.id}
          content={activeDocument.content}
        />
      )}
      <EditFAB />
      <PlanFAB />
    </main>
  );
}
