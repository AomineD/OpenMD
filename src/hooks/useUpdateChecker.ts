import { useState, useEffect } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useSettingsStore } from "@/stores/settingsStore";

export interface UpdateInfo {
  version: string;
  body: string | null;
  _update: Update;
}

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [installComplete, setInstallComplete] = useState(false);
  const checkUpdatesOnStartup = useSettingsStore(
    (s) => s.settings.checkUpdatesOnStartup
  );

  const checkForUpdates = async (): Promise<void> => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const update = await check();
      if (update?.available) {
        setUpdateInfo({ version: update.version, body: update.body ?? null, _update: update });
      }
    } catch (e) {
      // Silently ignore — network may be unavailable or no releases exist yet
      console.error("[useUpdateChecker] Check failed:", e);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstall = async (): Promise<void> => {
    if (!updateInfo?._update) return;
    setDownloadProgress(0);
    try {
      let downloaded = 0;
      let total = 0;
      await updateInfo._update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) {
            setDownloadProgress(Math.round((downloaded / total) * 100));
          }
        } else if (event.event === "Finished") {
          setDownloadProgress(100);
        }
      });
      setInstallComplete(true);
    } catch (e) {
      console.error("[useUpdateChecker] Download/install failed:", e);
    } finally {
      setDownloadProgress(null);
    }
  };

  const dismissUpdate = () => {
    setUpdateInfo(null);
    setInstallComplete(false);
  };

  // Check on startup with a 3s delay to avoid competing with app startup I/O
  useEffect(() => {
    if (!checkUpdatesOnStartup) return;
    const t = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(t);
  }, []); // Only on mount

  return {
    updateInfo,
    isChecking,
    downloadProgress,
    installComplete,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
  };
}
