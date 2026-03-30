import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

/**
 * Opens a native file picker dialog filtered to .md and .markdown files.
 * Returns the selected absolute path, or null if the user cancels.
 */
export async function openFileDialog(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Markdown",
        extensions: ["md", "markdown"],
      },
    ],
  });

  if (selected === null) {
    return null;
  }

  // With multiple: false, open() returns string | null
  return normalizePath(selected as string);
}

/**
 * Reads a Markdown file from disk and returns its content as a string.
 * Throws if the file does not exist or cannot be read.
 */
export async function readMarkdownFile(path: string): Promise<string> {
  return readTextFile(path);
}

/**
 * Writes content to a Markdown file on disk.
 * Creates the file if it does not exist. Used in Fase 4.
 */
export async function writeMarkdownFile(
  path: string,
  content: string
): Promise<void> {
  await writeTextFile(path, content);
}

/**
 * Normalizes a path to use forward slashes and removes trailing slashes.
 *
 * Critical: paths can arrive from multiple sources with mixed slash types:
 *   - C:\Users\User\docs\file.md  (from std::env::args())
 *   - C:/Users/User/docs/file.md  (from Tauri dialog plugin)
 *
 * Duplicate detection in documentStore compares paths as strings.
 * All paths must be normalized at ingestion point to ensure consistent comparison.
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "");
}

/**
 * Extracts the file name (including extension) from an absolute path.
 * Works with both forward and backward slashes.
 */
export function extractFileName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? path;
}
