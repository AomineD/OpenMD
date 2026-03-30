import { Pencil, Eye } from "lucide-react";
import { useDocumentStore } from "@/stores/documentStore";

export default function EditFAB() {
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const documents = useDocumentStore((s) => s.documents);
  const setMode = useDocumentStore((s) => s.setMode);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  if (!activeDoc) return null;

  const isEditing = activeDoc.mode === "edit";

  return (
    <button
      onClick={() => setMode(activeDoc.id, isEditing ? "view" : "edit")}
      title={isEditing ? "Preview (Ctrl+E)" : "Edit (Ctrl+E)"}
      className="fixed bottom-14 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-cyan-400 text-zinc-950 shadow-lg hover:bg-cyan-300 transition-colors duration-150 cursor-pointer"
    >
      {isEditing ? <Eye size={20} /> : <Pencil size={20} />}
    </button>
  );
}
