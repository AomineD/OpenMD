import { useCallback, useEffect, useRef } from "react";
import Editor, { loader, type Monaco } from "@monaco-editor/react";
import * as monacoEditor from "monaco-editor";
import type { editor } from "monaco-editor";

// Use locally bundled monaco-editor instead of CDN — required by Tauri CSP
loader.config({ monaco: monacoEditor });
import { useDocumentStore } from "@/stores/documentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { registerEditor, setEditorDocument } from "@/lib/editorBridge";

interface MonacoEditorInnerProps {
  documentId: string;
  content: string;
}

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  wordWrap: "on",
  minimap: { enabled: false },
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
  fontSize: 14,
  padding: { top: 16 },
  automaticLayout: true,
  renderLineHighlight: "line",
  cursorBlinking: "smooth",
  smoothScrolling: true,
  contextmenu: false,
  renderWhitespace: "none",
};

function defineOpenMDTheme(monaco: Monaco) {
  monaco.editor.defineTheme("openmd-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword.md", foreground: "22d3ee" },
      { token: "strong.md", foreground: "f1f5f9" },
      { token: "emphasis.md", foreground: "cbd5e1", fontStyle: "italic" },
      { token: "string.link.md", foreground: "22d3ee" },
      { token: "comment.md", foreground: "64748b" },
    ],
    colors: {
      "editor.background": "#09090b",
      "editor.foreground": "#e2e8f0",
      "editorLineNumber.foreground": "#4b5563",
      "editorLineNumber.activeForeground": "#94a3b8",
      "editor.selectionBackground": "#22d3ee33",
      "editorCursor.foreground": "#22d3ee",
      "editor.lineHighlightBackground": "#18181b",
      "editorWidget.background": "#18181b",
      "editorWidget.border": "#3f3f46",
      "input.background": "#27272a",
      "scrollbarSlider.background": "#3f3f4680",
      "scrollbarSlider.hoverBackground": "#52525b80",
      "editorIndentGuide.background1": "#27272a",
      "editorIndentGuide.activeBackground1": "#3f3f46",
    },
  });
}

export default function MonacoEditorInner({
  documentId,
  content,
}: MonacoEditorInnerProps) {
  const updateContent = useDocumentStore((state) => state.updateContent);
  const wordWrap = useSettingsStore((s) => s.settings.wordWrap);
  const fontSizeEditor = useSettingsStore((s) => s.settings.fontSizeEditor);

  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    ...EDITOR_OPTIONS,
    wordWrap: wordWrap ? "on" : "off",
    fontSize: fontSizeEditor,
  };
  // Ref ensures onChange closure always writes to the current documentId
  // even if tabs are switched while the editor is mounted.
  const documentIdRef = useRef(documentId);
  documentIdRef.current = documentId;

  // Keep the bridge in step with which document is on screen, so an outline
  // click can only reveal a line in the document it belongs to.
  useEffect(() => {
    setEditorDocument(documentId);
  }, [documentId]);

  useEffect(() => {
    return () => {
      registerEditor(null);
    };
  }, []);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    defineOpenMDTheme(monaco);
  }, []);

  const handleMount = useCallback(
    (instance: editor.IStandaloneCodeEditor) => {
      registerEditor(instance);
      setEditorDocument(documentIdRef.current);
    },
    []
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateContent(documentIdRef.current, value);
      }
    },
    [updateContent]
  );

  return (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      language="markdown"
      theme="openmd-dark"
      value={content}
      options={editorOptions}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={handleChange}
    />
  );
}
