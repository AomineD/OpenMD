import { ClipboardCopy, Check } from "lucide-react";
import { useState } from "react";
import { useDocumentStore } from "@/stores/documentStore";

export default function PlanFAB() {
  const [copied, setCopied] = useState(false);
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  const isPlanFile = activeDoc?.path.includes("/.plans/") ?? false;
  if (!activeDoc || !isPlanFile || activeDoc.mode === "edit") return null;

  const title =
    activeDoc.content.match(/^#\s+(.+)/m)?.[1] ??
    activeDoc.path.split(/[/\\]/).pop()?.replace(/\.md$/, "") ??
    "plan";

  const handleCopy = async () => {
    const prompt = `Implement the plan "${title}" at: ${activeDoc.path}`;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy implementation prompt to clipboard"
      className="fixed bottom-28 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 transition-colors duration-150 cursor-pointer"
    >
      {copied ? <Check size={20} /> : <ClipboardCopy size={20} />}
    </button>
  );
}
