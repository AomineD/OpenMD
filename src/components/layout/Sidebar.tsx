import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";
import RecentFiles from "@/components/sidebar/RecentFiles";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const sidebarVisible = useSettingsStore((s) => s.settings.sidebarVisible);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  return (
    <aside
      className={cn(
        "bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden transition-all duration-200",
        sidebarVisible ? "w-56" : "w-0"
      )}
    >
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-zinc-800 shrink-0">
        <span className="text-slate-600 text-xs font-medium uppercase tracking-wider select-none">
          Recent Files
        </span>
        <button
          onClick={() => clearHistory()}
          title="Clear history"
          className="text-slate-700 hover:text-slate-400 text-xs transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <RecentFiles />
      </div>
    </aside>
  );
}
