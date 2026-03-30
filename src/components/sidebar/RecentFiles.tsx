import { useEffect, useMemo, useState } from "react";
import { exists } from "@tauri-apps/plugin-fs";
import { AlertTriangle } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useHistoryStore } from "@/stores/historyStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useFileOpen } from "@/hooks/useFileOpen";
import { cn } from "@/lib/utils";

export default function RecentFiles() {
  const recentFiles = useHistoryStore((s) => s.recentFiles);
  const removeRecent = useHistoryStore((s) => s.removeRecent);
  const documents = useDocumentStore((s) => s.documents);
  const openDocPaths = useMemo(() => documents.map((d) => d.path), [documents]);
  const { openByPath } = useFileOpen();

  const [existsMap, setExistsMap] = useState<Map<string, boolean>>(new Map());

  const filtered = useMemo(
    () => recentFiles.filter((r) => !openDocPaths.includes(r.path)),
    [recentFiles, openDocPaths]
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setExistsMap(new Map());
      return;
    }

    let cancelled = false;
    const checkAll = async () => {
      const results = await Promise.all(
        filtered.map(async (r) => {
          try {
            const ok = await exists(r.path);
            return [r.path, ok] as [string, boolean];
          } catch {
            // Scope denial or inaccessible path — don't mark as missing
            return null;
          }
        })
      );
      if (!cancelled) {
        const definite = results.filter((r): r is [string, boolean] => r !== null);
        setExistsMap(new Map(definite));
      }
    };
    checkAll();
    return () => {
      cancelled = true;
    };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <p className="text-slate-600 text-xs px-3 py-4 text-center select-none">
        No recent files
      </p>
    );
  }

  return (
    <div>
      {filtered.map((r) => {
        const fileExists = existsMap.get(r.path);
        const isMissing = fileExists === false;

        return (
          <ContextMenu key={r.path}>
            <ContextMenuTrigger asChild>
              <div
                title={r.path}
                onClick={() => !isMissing && openByPath(r.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 select-none",
                  isMissing
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-zinc-800"
                )}
              >
                {isMissing && (
                  <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs truncate",
                    isMissing ? "text-slate-600" : "text-slate-300"
                  )}
                >
                  {r.fileName}
                </span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-zinc-900 border-zinc-700">
              <ContextMenuItem
                onClick={() => removeRecent(r.path)}
                className="text-slate-300 hover:bg-zinc-800 cursor-pointer text-sm"
              >
                Remove from list
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
