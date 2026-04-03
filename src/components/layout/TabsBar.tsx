import { useState } from "react";
import { useDocumentStore } from "@/stores/documentStore";
import { useUnsavedGuard } from "@/contexts/unsavedGuardContext";
import { useRefreshDocuments } from "@/hooks/useRefreshDocuments";
import { X, RefreshCw } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function TabsBar() {
  const documents = useDocumentStore((state) => state.documents);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const setActiveDocument = useDocumentStore((state) => state.setActiveDocument);
  const closeOtherDocuments = useDocumentStore(
    (state) => state.closeOtherDocuments
  );
  const closeAllDocuments = useDocumentStore((state) => state.closeAllDocuments);
  const { guardedCloseDocument } = useUnsavedGuard();
  const { refreshActiveDocument, refreshSingleDocument } = useRefreshDocuments();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshActiveDocument();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  if (documents.length === 0) {
    return (
      <div className="h-9 flex items-center bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="px-3 text-slate-600 text-xs select-none">
          No files open
        </div>
      </div>
    );
  }

  return (
    <div className="h-9 flex items-center bg-zinc-900 border-b border-zinc-800 shrink-0">
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin">
      {documents.map((doc) => {
        const isActive = doc.id === activeDocumentId;

        return (
          <ContextMenu key={doc.id}>
            <ContextMenuTrigger asChild>
              <div
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDocument(doc.id)}
                className={[
                  "h-9 flex items-center gap-1.5 px-3 text-sm cursor-pointer select-none shrink-0",
                  "border-r border-zinc-800 transition-colors group",
                  isActive
                    ? "bg-zinc-950 text-slate-50 border-t-2 border-t-cyan-400"
                    : "bg-zinc-900 text-slate-400 hover:bg-zinc-800 hover:text-slate-300",
                ].join(" ")}
              >
                {/* Dirty indicator */}
                {doc.isDirty && (
                  <span
                    className="text-cyan-400 text-xs"
                    title="Unsaved changes"
                  >
                    ●
                  </span>
                )}

                {/* File name */}
                <span className="max-w-32 truncate" title={doc.path}>
                  {doc.fileName}
                </span>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    guardedCloseDocument(doc.id);
                  }}
                  className={[
                    "rounded p-0.5 transition-colors",
                    isActive
                      ? "text-slate-400 hover:text-slate-50 hover:bg-zinc-800"
                      : "text-transparent group-hover:text-slate-500 hover:!text-slate-50 hover:bg-zinc-700",
                  ].join(" ")}
                  title="Close tab"
                >
                  <X size={12} />
                </button>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="bg-zinc-900 border-zinc-700 text-slate-200 min-w-40">
              <ContextMenuItem
                onClick={() => refreshSingleDocument(doc.id)}
                className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                disabled={doc.isDirty}
              >
                Refresh
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-zinc-700" />
              <ContextMenuItem
                onClick={() => guardedCloseDocument(doc.id)}
                className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
              >
                Close
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => closeOtherDocuments(doc.id)}
                className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                disabled={documents.length <= 1}
              >
                Close Others
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-zinc-700" />
              <ContextMenuItem
                onClick={() => closeAllDocuments()}
                className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
              >
                Close All
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
      </div>

      <button
        onClick={handleRefresh}
        disabled={!activeDocumentId}
        className="px-2 h-9 flex items-center text-slate-400 hover:text-slate-50 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        title="Refresh current file (F5)"
      >
        <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
