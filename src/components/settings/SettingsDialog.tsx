import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function Toggle({ value, onToggle, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
        value ? "bg-cyan-400" : "bg-zinc-700",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200",
          value ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-200">{label}</span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wider text-slate-500 pt-4 pb-1 first:pt-0">
      {children}
    </div>
  );
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { settings, setSetting } = useSettingsStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-slate-50 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Preferences</DialogTitle>
        </DialogHeader>

        <div className="divide-y divide-zinc-800">
          {/* Editor section */}
          <div className="pb-2">
            <SectionLabel>Editor</SectionLabel>
            <SettingRow label="Word Wrap">
              <Toggle
                value={settings.wordWrap}
                onToggle={() => setSetting("wordWrap", !settings.wordWrap)}
              />
            </SettingRow>
            <SettingRow label="Font Size" description="Range: 10–24">
              <input
                type="number"
                value={settings.fontSizeEditor}
                min={10}
                max={24}
                step={1}
                onChange={(e) => {
                  const v = Math.max(10, Math.min(24, Number(e.target.value)));
                  setSetting("fontSizeEditor", v);
                }}
                className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-slate-200 text-center focus:outline-none focus:border-cyan-400/50"
              />
            </SettingRow>
          </div>

          {/* Auto Save section */}
          <div className="py-2">
            <SectionLabel>Auto Save</SectionLabel>
            <SettingRow label="Enable Auto Save">
              <Toggle
                value={settings.autoSaveEnabled}
                onToggle={() =>
                  setSetting("autoSaveEnabled", !settings.autoSaveEnabled)
                }
              />
            </SettingRow>
            <SettingRow
              label="Save Interval"
              description="Seconds between saves (5–300)"
            >
              <input
                type="number"
                value={settings.autoSaveIntervalSeconds}
                min={5}
                max={300}
                step={1}
                disabled={!settings.autoSaveEnabled}
                onChange={(e) => {
                  const v = Math.max(
                    5,
                    Math.min(300, Number(e.target.value))
                  );
                  setSetting("autoSaveIntervalSeconds", v);
                }}
                className={cn(
                  "w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-slate-200 text-center focus:outline-none focus:border-cyan-400/50",
                  !settings.autoSaveEnabled && "opacity-40 cursor-not-allowed"
                )}
              />
            </SettingRow>
          </div>

          {/* Startup section */}
          <div className="pt-2">
            <SectionLabel>Startup</SectionLabel>
            <SettingRow label="Check for Updates on Startup">
              <Toggle
                value={settings.checkUpdatesOnStartup}
                onToggle={() =>
                  setSetting(
                    "checkUpdatesOnStartup",
                    !settings.checkUpdatesOnStartup
                  )
                }
              />
            </SettingRow>
          </div>
        </div>

        <div className="flex justify-end pt-2">
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
