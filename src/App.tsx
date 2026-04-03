import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TopBar from "@/components/layout/TopBar";
import TabsBar from "@/components/layout/TabsBar";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import StatusBar from "@/components/layout/StatusBar";
import UnsavedChangesDialog from "@/components/dialogs/UnsavedChangesDialog";
import SettingsDialog from "@/components/settings/SettingsDialog";
import UpdateDialog from "@/components/dialogs/UpdateDialog";
import AboutDialog from "@/components/dialogs/AboutDialog";
import { UnsavedGuardContext } from "@/contexts/unsavedGuardContext";
import { useFileOpen } from "@/hooks/useFileOpen";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { useRefreshDocuments } from "@/hooks/useRefreshDocuments";
import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { useDocumentStore } from "@/stores/documentStore";
import { restoreWindowState } from "@/hooks/useWindowState";

export default function App() {
  const { openByPath } = useFileOpen();
  const { refreshAllDocuments, refreshActiveDocument } = useRefreshDocuments();
  const {
    dialogState,
    handleDialogResult,
    guardedCloseDocument,
    guardWindowClose,
  } = useUnsavedChangesGuard();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const {
    updateInfo,
    isChecking: _isChecking,
    downloadProgress,
    installComplete,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
  } = useUpdateChecker();

  // Load persistent state, restore window, restore session, and open CLI file if passed
  useEffect(() => {
    async function init() {
      useSettingsStore.getState().loadFromDisk();
      useHistoryStore.getState().loadFromDisk();
      await restoreWindowState();
      await useDocumentStore.getState().restoreSession();
      const cliPath = await invoke<string | null>("get_initial_file_path");
      if (cliPath) openByPath(cliPath);
    }
    init();
  }, []);

  // Auto-save hook
  useAutoSave();

  // Listen for file open events from Rust (CLI args + single-instance forwarding)
  useEffect(() => {
    const unlisten = listen<string>("open-file", (event) => {
      if (event.payload) {
        openByPath(event.payload);
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [openByPath]);

  // Auto-refresh open documents when window regains focus; save session on blur
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        refreshAllDocuments();
      } else {
        useDocumentStore.getState().saveSession();
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [refreshAllDocuments]);

  // Intercept OS window close (Alt+F4, title bar X) to guard dirty documents
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onCloseRequested(async (event) => {
      event.preventDefault(); // must be synchronous before await
      await guardWindowClose();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [guardWindowClose]);

  return (
    <UnsavedGuardContext.Provider value={{ guardedCloseDocument }}>
      <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-slate-50">
        {/* Top chrome */}
        <TopBar
          onSettingsOpen={() => setSettingsOpen(true)}
          onCheckUpdates={checkForUpdates}
          onAboutOpen={() => setAboutOpen(true)}
          onRefreshActive={refreshActiveDocument}
        />
        <TabsBar />

        {/* Main workspace */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>

        {/* Bottom chrome */}
        <StatusBar />
      </div>
      <UnsavedChangesDialog state={dialogState} onResult={handleDialogResult} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UpdateDialog
        info={updateInfo}
        installComplete={installComplete}
        onInstall={downloadAndInstall}
        onDismiss={dismissUpdate}
        downloadProgress={downloadProgress}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </UnsavedGuardContext.Provider>
  );
}
