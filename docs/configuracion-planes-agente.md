# Integración de Planes con OpenMD — Guía de Configuración

Abre automáticamente los archivos de plan de tu agente IA en OpenMD para leerlos
cómodamente, y copia el prompt de implementación con un clic.

---

## Cómo funciona

1. Un agente IA (Claude Code, OpenCode, Codex) crea un plan y lo guarda en `.plans/`
2. OpenMD abre el archivo automáticamente
3. Lees el plan en el visor
4. Haces clic en el botón verde de portapapeles para copiar el prompt de implementación
5. Lo pegas en el chat de tu agente para iniciar la ejecución

---

## Configuración para Claude Code

### 1. Configurar directorio de planes

En `.claude/settings.json` (proyecto) o `~/.claude/settings.json` (global):

```json
{
  "plansDirectory": ".plans"
}
```

### 2. Instalar el hook de apertura automática

Crea `~/.claude/hooks/open-plan.py`:

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

Registra el hook en `~/.claude/settings.json`:

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

### 3. Añadir regla de instrucciones a `CLAUDE.md`

```markdown
## Plan Files

- Siempre guardar planes en `.plans/` en la raíz del proyecto (crear el directorio si no existe)
- Nomenclatura: `.plans/YYYY-MM-DD_<topic-slug>.md`
- Al guardar un archivo de plan, se abre automáticamente en OpenMD via hook
- Nunca mostrar planes largos en el chat cuando se pueden escribir a un archivo
```

---

## Configuración para OpenCode / Codex

Crea `AGENTS.md` en la raíz del proyecto:

```markdown
## Plan Files

Cuando se te pida planificar o crear una especificación:

1. Guarda en `.plans/` en la raíz del proyecto — nunca muestres planes como mensajes de chat
2. Nomenclatura: `.plans/YYYY-MM-DD_<topic-slug>.md`
3. Crea el directorio si no existe
4. Después de guardar, ábrelo: `openmd "<ruta-absoluta>"`
```

---

## `.plans/` en `.gitignore`

Los archivos de plan son artefactos locales generados por IA. Añade a `.gitignore`:

```
.plans/
```

---

## Botón "Implementar Plan"

Al abrir un archivo `.plans/*.md` en OpenMD, aparece un botón verde de portapapeles
(sobre el FAB de edición, esquina inferior derecha).

Al hacer clic copia:
```
Implement the plan "<título>" at: <ruta>
```

Pégalo directamente en Claude Code, OpenCode o cualquier otro agente para iniciar la implementación.

---

## Resolución del ejecutable OpenMD

El hook encuentra `openmd.exe` en este orden:

1. `PATH` del sistema — añade `%LOCALAPPDATA%\OpenMD` al PATH para que funcione así
2. `%LOCALAPPDATA%\OpenMD\openmd.exe` — ubicación por defecto del instalador NSIS
3. `<cwd>/src-tauri/target/debug/openmd.exe` — fallback para build de desarrollo
