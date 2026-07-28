import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";
import RecentFiles from "@/components/sidebar/RecentFiles";
import DocumentOutline from "@/components/sidebar/DocumentOutline";
import { cn } from "@/lib/utils";

type Panel = "recent" | "outline";

const PANELS: { id: Panel; label: string; title: string }[] = [
  { id: "recent", label: "Recent", title: "Recent Files" },
  { id: "outline", label: "Nav", title: "Navigation" },
];

export default function Sidebar() {
  const sidebarVisible = useSettingsStore((s) => s.settings.sidebarVisible);
  const sidebarPanel = useSettingsStore((s) => s.settings.sidebarPanel);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const current = PANELS.find((p) => p.id === sidebarPanel) ?? PANELS[0];

  return (
    <aside
      className={cn(
        "bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden transition-all duration-200",
        sidebarVisible ? "w-56" : "w-0"
      )}
    >
      {/* Header — title of the panel currently showing */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-zinc-800 shrink-0">
        <span className="text-slate-600 text-xs font-medium uppercase tracking-wider select-none">
          {current.title}
        </span>
        {/* Clearing history only makes sense while that panel is showing */}
        {sidebarPanel === "recent" && (
          <button
            onClick={() => clearHistory()}
            title="Clear history"
            className="text-slate-700 hover:text-slate-400 text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content — skipped entirely while collapsed, since the aside stays mounted */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sidebarVisible &&
          (sidebarPanel === "outline" ? <DocumentOutline /> : <RecentFiles />)}
      </div>

      {/* Panel switcher. The choice is persisted, so it survives restarts. */}
      <div className="h-8 flex items-stretch border-t border-zinc-800 shrink-0">
        {PANELS.map((panel) => {
          const isActive = panel.id === sidebarPanel;
          return (
            <button
              key={panel.id}
              onClick={() => setSetting("sidebarPanel", panel.id)}
              aria-pressed={isActive}
              title={panel.title}
              className={cn(
                "flex-1 text-xs font-medium uppercase tracking-wider select-none transition-colors",
                "border-t-2 first:border-r first:border-r-zinc-800",
                isActive
                  ? "border-t-cyan-400 bg-zinc-800 text-cyan-400"
                  : "border-t-transparent text-slate-600 hover:bg-zinc-800/50 hover:text-slate-400"
              )}
            >
              {panel.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
