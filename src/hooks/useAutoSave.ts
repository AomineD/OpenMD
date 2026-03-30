import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDocumentStore } from "@/stores/documentStore";
import { writeMarkdownFile } from "@/lib/fileOperations";

export function useAutoSave(): void {
  const autoSaveEnabled = useSettingsStore((s) => s.settings.autoSaveEnabled);
  const autoSaveIntervalSeconds = useSettingsStore(
    (s) => s.settings.autoSaveIntervalSeconds
  );

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const id = setInterval(() => {
      const { documents, markSaved } = useDocumentStore.getState();
      documents
        .filter((d) => d.isDirty)
        .forEach(async (d) => {
          try {
            await writeMarkdownFile(d.path, d.content);
            markSaved(d.id);
          } catch (e) {
            console.error("[useAutoSave] Failed to save:", d.path, e);
          }
        });
    }, autoSaveIntervalSeconds * 1000);

    return () => clearInterval(id);
  }, [autoSaveEnabled, autoSaveIntervalSeconds]);
}
