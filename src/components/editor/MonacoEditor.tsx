import { lazy, Suspense } from "react";

const MonacoEditorInner = lazy(() => import("./MonacoEditorInner"));

interface MonacoEditorProps {
  documentId: string;
  content: string;
}

function EditorSkeleton() {
  return (
    <div className="h-full w-full bg-zinc-950 flex">
      {/* Line number gutter simulation */}
      <div className="w-12 border-r border-zinc-900 flex flex-col gap-2.5 pt-4 px-2 shrink-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 rounded bg-zinc-800/50 animate-pulse"
            style={{ width: `${16 + (i % 3) * 6}px` }}
          />
        ))}
      </div>
      {/* Content area simulation */}
      <div className="flex-1 pt-4 px-5 flex flex-col gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 rounded bg-zinc-800/40 animate-pulse"
            style={{ width: `${25 + (i % 7) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MonacoEditor({ documentId, content }: MonacoEditorProps) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <MonacoEditorInner documentId={documentId} content={content} />
    </Suspense>
  );
}
