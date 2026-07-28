import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useFileOpen } from "@/hooks/useFileOpen";
import { useDocumentStore } from "@/stores/documentStore";
import { useSaveFile } from "@/hooks/useSaveFile";
import { useUnsavedGuard } from "@/contexts/unsavedGuardContext";
import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { cn } from "@/lib/utils";

type MenuName = "file" | "view" | "settings" | "help" | null;

interface TopBarProps {
  onSettingsOpen: () => void;
  onCheckUpdates?: () => void;
  onAboutOpen?: () => void;
  onRefreshActive?: () => void;
}

export default function TopBar({
  onSettingsOpen,
  onCheckUpdates,
  onAboutOpen,
  onRefreshActive,
}: TopBarProps) {
  const { openFromDialog, openByPath } = useFileOpen();
  const closeAllDocuments = useDocumentStore((state) => state.closeAllDocuments);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const documents = useDocumentStore((state) => state.documents);
  const setMode = useDocumentStore((state) => state.setMode);
  const setActiveDocument = useDocumentStore((state) => state.setActiveDocument);
  const { saveDocument, saveDocumentAs } = useSaveFile();
  const { guardedCloseDocument } = useUnsavedGuard();
  const { settings, setSetting } = useSettingsStore();
  const recentFiles = useHistoryStore((s) => s.recentFiles);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  const [openMenu, setOpenMenu] = useState<MenuName>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /** Reveals the outline panel, opening the sidebar if it was collapsed. */
  const showOutline = () => {
    setSetting("sidebarPanel", "outline");
    if (!settings.sidebarVisible) setSetting("sidebarVisible", true);
  };

  const applyZoom = (delta: number) => {
    const next =
      delta === 0 ? 1.0 : Math.max(0.6, Math.min(2.0, zoomLevel + delta));
    setZoomLevel(next);
    document.documentElement.style.zoom = String(next);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && !e.shiftKey && e.key === "o") {
        e.preventDefault();
        openFromDialog();
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setSetting("sidebarPanel", "outline");
        if (!settings.sidebarVisible) setSetting("sidebarVisible", true);
      }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        // A pinned tab hides its close button; the shortcut must agree
        if (activeDocumentId && !activeDoc?.isPinned) {
          guardedCloseDocument(activeDocumentId);
        }
      }
      if (e.ctrlKey && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        if (activeDocumentId) saveDocument(activeDocumentId);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeDocumentId) saveDocumentAs(activeDocumentId);
      }
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        if (activeDocumentId) {
          const doc = documents.find((d) => d.id === activeDocumentId);
          if (doc) setMode(activeDocumentId, doc.mode === "view" ? "edit" : "view");
        }
      }
      if (e.key === "F5") {
        e.preventDefault();
        onRefreshActive?.();
      }
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setSetting("sidebarVisible", !settings.sidebarVisible);
      }
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        if (documents.length > 1 && activeDocumentId) {
          const idx = documents.findIndex((d) => d.id === activeDocumentId);
          const next = e.shiftKey
            ? documents[(idx - 1 + documents.length) % documents.length]
            : documents[(idx + 1) % documents.length];
          setActiveDocument(next.id);
        }
      }
      if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        applyZoom(0.1);
      }
      if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        applyZoom(-0.1);
      }
      if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        applyZoom(0);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    openFromDialog,
    guardedCloseDocument,
    saveDocument,
    saveDocumentAs,
    activeDocumentId,
    documents,
    setMode,
    setSetting,
    activeDoc?.isPinned,
    settings.sidebarVisible,
    setActiveDocument,
    zoomLevel,
    onRefreshActive,
  ]);

  const toggleMenu = (menu: MenuName) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <header className="h-10 flex items-center px-3 bg-zinc-900 border-b border-zinc-800 shrink-0 relative z-50">
      {/* Logo */}
      <span className="text-cyan-400 font-bold text-base tracking-tight select-none mr-4">
        OpenMD
      </span>

      {/* Menu bar */}
      <nav ref={menuRef} className="flex items-center gap-0.5">
        {/* File menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("file")}
            className={cn(
              "text-sm px-2 py-1 rounded transition-colors",
              openMenu === "file"
                ? "bg-zinc-700 text-slate-50"
                : "text-slate-400 hover:text-slate-50 hover:bg-zinc-800"
            )}
          >
            File
          </button>

          {openMenu === "file" && (
            <div className="absolute top-full left-0 mt-0.5 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-52 py-1">
              <MenuItem
                label="Open MD"
                shortcut="Ctrl+O"
                onClick={() => {
                  setOpenMenu(null);
                  openFromDialog();
                }}
              />

              {/* Open Recent submenu */}
              <div className="relative group/recent">
                <button className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-200 hover:bg-zinc-800 cursor-pointer">
                  <span>Open Recent</span>
                  <span className="text-slate-500 text-xs">▶</span>
                </button>
                <div className="absolute left-full top-0 ml-0.5 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-64 py-1 hidden group-hover/recent:block z-50">
                  {recentFiles.length === 0 ? (
                    <p className="px-3 py-1.5 text-xs text-slate-600 select-none">
                      No recent files
                    </p>
                  ) : (
                    <>
                      {recentFiles.slice(0, 10).map((r) => (
                        <button
                          key={r.path}
                          title={r.path}
                          onClick={() => {
                            setOpenMenu(null);
                            openByPath(r.path);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-zinc-800 truncate block"
                        >
                          {r.fileName}
                        </button>
                      ))}
                      <div className="my-1 border-t border-zinc-700" />
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          clearHistory();
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-slate-500 hover:bg-zinc-800"
                      >
                        Clear History
                      </button>
                    </>
                  )}
                </div>
              </div>

              <MenuItem
                label="Refresh"
                shortcut="F5"
                disabled={!activeDocumentId}
                onClick={() => {
                  setOpenMenu(null);
                  onRefreshActive?.();
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <MenuItem
                label="Save"
                shortcut="Ctrl+S"
                disabled={!activeDocumentId || !activeDoc?.isDirty}
                onClick={() => {
                  setOpenMenu(null);
                  if (activeDocumentId) saveDocument(activeDocumentId);
                }}
              />
              <MenuItem
                label="Save As…"
                shortcut="Ctrl+Shift+S"
                disabled={!activeDocumentId}
                onClick={() => {
                  setOpenMenu(null);
                  if (activeDocumentId) saveDocumentAs(activeDocumentId);
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <MenuItem
                label="Close Tab"
                shortcut="Ctrl+W"
                disabled={!activeDocumentId}
                onClick={() => {
                  setOpenMenu(null);
                  if (activeDocumentId) guardedCloseDocument(activeDocumentId);
                }}
              />
              <MenuItem
                label="Close All Tabs"
                disabled={!activeDocumentId}
                onClick={() => {
                  setOpenMenu(null);
                  closeAllDocuments();
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <MenuItem
                label="Exit"
                onClick={() => {
                  setOpenMenu(null);
                  getCurrentWindow().close();
                }}
              />
            </div>
          )}
        </div>

        {/* View menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("view")}
            className={cn(
              "text-sm px-2 py-1 rounded transition-colors",
              openMenu === "view"
                ? "bg-zinc-700 text-slate-50"
                : "text-slate-400 hover:text-slate-50 hover:bg-zinc-800"
            )}
          >
            View
          </button>

          {openMenu === "view" && (
            <div className="absolute top-full left-0 mt-0.5 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-52 py-1">
              <MenuItem
                label={settings.sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                shortcut="Ctrl+B"
                onClick={() => {
                  setOpenMenu(null);
                  setSetting("sidebarVisible", !settings.sidebarVisible);
                }}
              />
              <MenuItem
                label="Document Outline"
                shortcut="Ctrl+Shift+O"
                onClick={() => {
                  setOpenMenu(null);
                  showOutline();
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <MenuItem
                label="Zoom In"
                shortcut="Ctrl+="
                onClick={() => {
                  setOpenMenu(null);
                  applyZoom(0.1);
                }}
              />
              <MenuItem
                label="Zoom Out"
                shortcut="Ctrl+-"
                onClick={() => {
                  setOpenMenu(null);
                  applyZoom(-0.1);
                }}
              />
              <MenuItem
                label="Reset Zoom"
                shortcut="Ctrl+0"
                onClick={() => {
                  setOpenMenu(null);
                  applyZoom(0);
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <CheckMenuItem
                label="Word Wrap"
                checked={settings.wordWrap}
                onClick={() => {
                  setOpenMenu(null);
                  setSetting("wordWrap", !settings.wordWrap);
                }}
              />
            </div>
          )}
        </div>

        {/* Settings menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("settings")}
            className={cn(
              "text-sm px-2 py-1 rounded transition-colors",
              openMenu === "settings"
                ? "bg-zinc-700 text-slate-50"
                : "text-slate-400 hover:text-slate-50 hover:bg-zinc-800"
            )}
          >
            Settings
          </button>

          {openMenu === "settings" && (
            <div className="absolute top-full left-0 mt-0.5 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-52 py-1">
              <MenuItem
                label="Preferences…"
                onClick={() => {
                  setOpenMenu(null);
                  onSettingsOpen();
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <MenuItem
                label="Check for Updates"
                disabled={!onCheckUpdates}
                onClick={() => {
                  setOpenMenu(null);
                  onCheckUpdates?.();
                }}
              />
            </div>
          )}
        </div>

        {/* Help menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu("help")}
            className={cn(
              "text-sm px-2 py-1 rounded transition-colors",
              openMenu === "help"
                ? "bg-zinc-700 text-slate-50"
                : "text-slate-400 hover:text-slate-50 hover:bg-zinc-800"
            )}
          >
            Help
          </button>

          {openMenu === "help" && (
            <div className="absolute top-full left-0 mt-0.5 bg-zinc-900 border border-zinc-700 rounded shadow-xl min-w-52 py-1">
              <MenuItem
                label="About OpenMD"
                disabled={!onAboutOpen}
                onClick={() => {
                  setOpenMenu(null);
                  onAboutOpen?.();
                }}
              />
              <div className="my-1 border-t border-zinc-700" />
              <MenuItem
                label="GitHub Repository"
                onClick={() => {
                  setOpenMenu(null);
                  openUrl("https://github.com/AomineD/OpenMD");
                }}
              />
              <MenuItem
                label="Report Issue"
                onClick={() => {
                  setOpenMenu(null);
                  openUrl("https://github.com/AomineD/OpenMD/issues");
                }}
              />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

interface MenuItemProps {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}

function MenuItem({ label, shortcut, disabled, onClick }: MenuItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between px-3 py-1.5 text-sm",
        disabled
          ? "text-slate-600 cursor-not-allowed"
          : "text-slate-200 hover:bg-zinc-800 cursor-pointer"
      )}
    >
      <span>{label}</span>
      {shortcut && <span className="text-slate-500 text-xs">{shortcut}</span>}
    </button>
  );
}

interface CheckMenuItemProps {
  label: string;
  checked: boolean;
  onClick: () => void;
}

function CheckMenuItem({ label, checked, onClick }: CheckMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-200 hover:bg-zinc-800 cursor-pointer"
    >
      <span>{label}</span>
      <span className="text-cyan-400 text-xs">{checked ? "✓" : ""}</span>
    </button>
  );
}
