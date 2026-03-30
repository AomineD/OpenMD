import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import { loadJSON, saveJSON } from "@/lib/persistence";

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
}

const DEFAULT_WINDOW: WindowState = { width: 1200, height: 800, x: -1, y: -1 };

export async function restoreWindowState(): Promise<void> {
  try {
    const state = await loadJSON<WindowState>("window-state.json", DEFAULT_WINDOW);
    const win = getCurrentWindow();
    await win.setSize(new PhysicalSize(state.width, state.height));
    if (state.x !== -1 && state.y !== -1) {
      await win.setPosition(new PhysicalPosition(state.x, state.y));
    }
  } catch (e) {
    console.error("[useWindowState] Failed to restore window state:", e);
  }
}

export async function saveWindowState(): Promise<void> {
  try {
    const win = getCurrentWindow();
    const size = await win.innerSize();
    const pos = await win.outerPosition();
    await saveJSON("window-state.json", {
      width: size.width,
      height: size.height,
      x: pos.x,
      y: pos.y,
    });
  } catch (e) {
    console.error("[useWindowState] Failed to save window state:", e);
  }
}
