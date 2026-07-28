/**
 * Lets the outline panel jump to a line in the editor without importing Monaco.
 *
 * The interface is structural on purpose: importing Monaco's types here would
 * pull the editor into the main bundle, and it must stay lazy-loaded.
 */
export interface RevealableEditor {
  revealLineInCenter(line: number): void;
  setPosition(position: { lineNumber: number; column: number }): void;
  focus(): void;
}

let editor: RevealableEditor | null = null;
/** Which document the live editor instance is currently showing. */
let editorDocumentId: string | null = null;

export function registerEditor(instance: RevealableEditor | null): void {
  editor = instance;
  if (!instance) editorDocumentId = null;
}

export function setEditorDocument(documentId: string | null): void {
  editorDocumentId = documentId;
}

/**
 * Reveals `line` in the editor, but only when it is showing `documentId`.
 * The Monaco instance survives tab switches, so an unguarded reveal would
 * scroll the wrong document.
 */
export function revealEditorLine(documentId: string, line: number): boolean {
  if (!editor || editorDocumentId !== documentId) return false;
  editor.revealLineInCenter(line);
  editor.setPosition({ lineNumber: line, column: 1 });
  editor.focus();
  return true;
}
