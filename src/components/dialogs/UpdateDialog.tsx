import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UpdateInfo } from "@/hooks/useUpdateChecker";
import { cn } from "@/lib/utils";

interface UpdateDialogProps {
  info: UpdateInfo | null;
  installComplete: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  downloadProgress: number | null;
}

export default function UpdateDialog({
  info,
  installComplete,
  onInstall,
  onDismiss,
  downloadProgress,
}: UpdateDialogProps) {
  const [currentVersion, setCurrentVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(() => {});
  }, []);

  const isDownloading = downloadProgress !== null;
  const open = info !== null || installComplete;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-slate-50 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {installComplete ? "Update Installed" : "Update Available"}
          </DialogTitle>
        </DialogHeader>

        {installComplete ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              The update has been installed. Restart OpenMD to apply the new
              version.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onDismiss}
                className="px-4 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          info && (
            <div className="space-y-3">
              <div className="text-sm text-slate-300 space-y-1">
                <p>
                  <span className="text-cyan-400 font-medium">
                    OpenMD v{info.version}
                  </span>{" "}
                  is available.
                </p>
                {currentVersion && (
                  <p className="text-slate-500">
                    You are currently on v{currentVersion}.
                  </p>
                )}
              </div>

              {info.body && (
                <pre className="text-xs text-slate-400 bg-zinc-950 rounded p-3 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                  {info.body}
                </pre>
              )}

              {/* Progress bar */}
              {isDownloading && (
                <div className="space-y-1">
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-1 bg-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-right">
                    {downloadProgress}%
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onDismiss}
                  disabled={isDownloading}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-slate-200 transition-colors",
                    isDownloading && "opacity-40 cursor-not-allowed"
                  )}
                >
                  Later
                </button>
                <button
                  onClick={onInstall}
                  disabled={isDownloading}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium transition-colors",
                    isDownloading && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {isDownloading ? "Downloading…" : "Download & Install"}
                </button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
