import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@/styles/globals.css";

// Catch errors that occur before React mounts (module initialization, etc.)
window.addEventListener("error", (e) => {
  const root = document.getElementById("root");
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<pre style="color:#22d3ee;background:#09090b;padding:2rem;font-family:monospace;font-size:12px;white-space:pre-wrap;overflow:auto;height:100vh"><strong style="font-size:14px;color:#f87171">OpenMD — Pre-mount Error</strong>\n\n${e.message}\n\n${e.filename}:${e.lineno}\n\n${e.error?.stack ?? ""}</pre>`;
  }
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[OpenMD] Unhandled rejection:", e.reason);
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message + "\n\n" + (error.stack ?? "") };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            color: "#22d3ee",
            background: "#09090b",
            padding: "2rem",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            fontSize: "12px",
            overflow: "auto",
            height: "100vh",
          }}
        >
          <strong style={{ fontSize: "14px", color: "#f87171" }}>
            OpenMD — Startup Error
          </strong>
          {"\n\n"}
          {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
