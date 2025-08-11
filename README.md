# VoiceFlow AI — Real‑Time, Multilingual Speech‑to‑Text (AssemblyAI)

This project records audio in the browser, visualizes it, and streams **live transcripts** from **AssemblyAI** via a tiny Python backend.

## Files (current set)
```
advanced_index_patched.html  # Main HTML you open (includes aai_bridge.js)
advanced_script.js           # Frontend logic: recorder, UI, visualizer, exports
advanced_styles.css          # Styles
aai_bridge.js                # WebSocket glue: receives transcripts, updates UI
server.py                    # FastAPI backend: mic -> AssemblyAI -> WebSocket
```

---

## How it works
1. You open **`advanced_index_patched.html`** (preferably via VS Code **Live Server**).
2. The page loads `advanced_script.js` and `aai_bridge.js`.
3. On **Record**, the bridge connects to `ws://localhost:8000/ws`.
4. **`server.py`** streams your machine’s mic to **AssemblyAI**, receives transcripts, and sends `{ transcript, end_of_turn }` back.
5. The UI shows interim text live and appends final text into the editor, with confidence/word count/history.

---

## Quick Start

### 1) Backend (Python)
**Windows (PowerShell)**
```powershell
pip install "assemblyai[extras]" fastapi "uvicorn[standard]"
uvicorn server:app --reload --port 8000
```

**macOS**
```bash
brew install portaudio
pip install "assemblyai[extras]" fastapi "uvicorn[standard]"
uvicorn server:app --reload --port 8000
```

**Ubuntu/Debian**
```bash
sudo apt update && sudo apt install -y portaudio19-dev
pip install "assemblyai[extras]" fastapi "uvicorn[standard]"
uvicorn server:app --reload --port 8000
```

Keep this terminal **open** while using the app.

### 2) Frontend (VS Code Live Server)
1. Install the **Live Server** extension in VS Code.
2. Right‑click **`advanced_index_patched.html`** → **Open with Live Server**.
3. Click **Record** and speak. You should see live text appear.

---

## Multilingual
- Pick your language in the page dropdown (e.g., `en-US`, `ar-SA`, `fr-FR`, …).
- AssemblyAI supports many languages; the page will display transcripts in the language configured.

---

## Common tweaks
- **Rename entry file:** You can rename `advanced_index_patched.html` to `index.html` so Live Server opens it by default.
- **Change port:** If you start the backend on another port, update the WS URL inside **`aai_bridge.js`** (`ws://localhost:<PORT>/ws`).

---

## Troubleshooting
- **No text appears:** Ensure `uvicorn` is running and you opened the **patched** HTML via Live Server.
- **WebSocket errors:** Firewalls/VPNs can block localhost sockets. Allow Python or try another network/port.
- **Mic issues:** Backend uses the mic on the machine running `server.py`. Grant OS mic permissions.

---

## Security
`server.py` contains a **hardcoded AssemblyAI API key** (per your request). This is fine for local demos—**don’t publish** the key or repo as‑is.
