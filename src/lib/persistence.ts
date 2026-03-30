import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";

async function ensureDir(): Promise<void> {
  const dirExists = await exists(".", { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir(".", { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function loadJSON<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const text = await readTextFile(filename, { baseDir: BaseDirectory.AppData });
    return JSON.parse(text) as T;
  } catch {
    return defaultValue;
  }
}

export async function saveJSON<T>(filename: string, data: T): Promise<void> {
  try {
    await ensureDir();
    await writeTextFile(filename, JSON.stringify(data, null, 2), {
      baseDir: BaseDirectory.AppData,
    });
  } catch (e) {
    console.error(`[persistence] Failed to save "${filename}":`, e);
  }
}
