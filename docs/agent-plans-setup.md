# Agent Plans Integration — Setup Guide

Open your AI agent's plan files automatically in OpenMD for comfortable reading,
and copy the implementation prompt with one click.

---

## How It Works

1. An AI agent (Claude Code, OpenCode, Codex) creates a plan and saves it to `.plans/`
2. OpenMD opens the file automatically
3. You read the plan in the viewer
4. Click the green clipboard button to copy the implementation prompt
5. Paste it into your agent's chat to start execution

---

## Claude Code Setup

### 1. Set plans directory

In `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "plansDirectory": ".plans"
}
```

### 2. Install the auto-open hook

Create `~/.claude/hooks/open-plan.py`:

```python
#!/usr/bin/env python3
import sys, json, os, re, shutil, subprocess

def find_openmd():
    exe = shutil.which("openmd") or shutil.which("openmd.exe")
    if exe:
        return exe
    local = os.environ.get("LOCALAPPDATA", "")
    if local:
        c = os.path.join(local, "OpenMD", "openmd.exe")
        if os.path.isfile(c):
            return c
    dev = os.path.join(os.getcwd(), "src-tauri", "target", "debug", "openmd.exe")
    return dev if os.path.isfile(dev) else None

def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        return
    path = data.get("tool_input", {}).get("file_path", "")
    if re.search(r"[/\\]\.plans[/\\][^/\\]+\.md$", path):
        exe = find_openmd()
        if exe:
            subprocess.Popen([exe, path], shell=True)

if __name__ == "__main__":
    main()
```

Register the hook in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/open-plan.py"
          }
        ]
      }
    ]
  }
}
```

### 3. Add instruction rule to `CLAUDE.md`

```markdown
## Plan Files

- Always save plans to `.plans/` in the project root (create the directory if needed)
- Naming: `.plans/YYYY-MM-DD_<topic-slug>.md`
- After writing a plan file, it opens automatically in OpenMD via hook — no manual action needed
- Never output long plans inline in chat when writing them to a file
```

---

## OpenCode / Codex Setup

Create `AGENTS.md` in the project root:

```markdown
## Plan Files

When asked to plan or create a specification:

1. Save to `.plans/` in the project root — never output plans as chat messages
2. Naming: `.plans/YYYY-MM-DD_<topic-slug>.md`
3. Create the directory if it doesn't exist
4. After saving, open it: `openmd "<absolute-path>"`
```

---

## `.plans/` in `.gitignore`

Plan files are local AI-generated artifacts. Add to `.gitignore`:

```
.plans/
```

---

## "Implement Plan" Button

When you open a `.plans/*.md` file in OpenMD, a green clipboard button appears
(above the edit FAB, bottom-right corner).

Clicking it copies:
```
Implement the plan "<title>" at: <path>
```

Paste this directly into Claude Code, OpenCode, or any other agent to start implementation.

---

## OpenMD Executable Resolution

The hook finds `openmd.exe` in this order:

1. System `PATH` — add `%LOCALAPPDATA%\OpenMD` to PATH for this to work
2. `%LOCALAPPDATA%\OpenMD\openmd.exe` — default NSIS install location
3. `<cwd>/src-tauri/target/debug/openmd.exe` — dev build fallback
