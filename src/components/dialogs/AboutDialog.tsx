import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutDialog({ open: isOpen, onClose }: AboutDialogProps) {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-slate-50 max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">About OpenMD</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-3 py-2">
          {/* Logo */}
          <div className="text-5xl font-black text-cyan-400 tracking-tighter leading-none select-none">
            OpenMD
          </div>

          {version && (
            <span className="text-xs text-slate-500 font-mono">v{version}</span>
          )}

          <p className="text-sm text-slate-400">
            A lightweight Markdown viewer and editor for Windows
          </p>

          <span className="text-xs text-slate-600 bg-zinc-800 px-2 py-0.5 rounded">
            MIT License
          </span>

          {/* Links */}
          <div className="flex flex-col gap-1.5 w-full pt-1">
            <button
              onClick={() => openUrl("https://github.com/AomineD/OpenMD")}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline"
            >
              GitHub Repository
            </button>
            <button
              onClick={() => openUrl("https://github.com/AomineD/OpenMD/issues")}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors underline-offset-2 hover:underline"
            >
              Report an Issue
            </button>
          </div>

          <p className="text-xs text-slate-700 pt-1">Built with Tauri + React</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
