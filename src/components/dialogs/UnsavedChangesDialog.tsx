import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UnsavedDialogState } from "@/hooks/useUnsavedChangesGuard";

interface UnsavedChangesDialogProps {
  state: UnsavedDialogState;
  onResult: (result: "save" | "discard" | "cancel") => void;
}

export default function UnsavedChangesDialog({
  state,
  onResult,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) onResult("cancel");
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            {state.open
              ? `"${state.fileName}" has unsaved changes. What would you like to do?`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <button
            onClick={() => onResult("cancel")}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 rounded hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onResult("discard")}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
          >
            Don't Save
          </button>
          <button
            onClick={() => onResult("save")}
            className="px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium rounded transition-colors"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
