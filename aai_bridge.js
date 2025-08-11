// aai_bridge.js
// Plugs AssemblyAI streaming (via server.py) into your existing VoiceFlow AI app.
// Requires server.py running at ws://localhost:8000/ws

(function attachAssemblyAI() {
  const ASSEMBLY_WS_URL = "ws://localhost:8000/ws";

  class AssemblyAIStreamClient {
    constructor() {
      this.ws = null;
      this.connected = false;
      this.keepAlive = null;
      this.finalSoFar = "";
    }

    connect() {
      if (this.connected) return;
      try {
        this.ws = new WebSocket(ASSEMBLY_WS_URL);
      } catch (e) {
        console.error("WebSocket init failed:", e);
        return;
      }

      this.ws.onopen = () => {
        this.connected = true;
        if (window.VoiceFlowAI?.notifications) {
          window.VoiceFlowAI.notifications.success("Connected to AssemblyAI");
        }
        this.keepAlive = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) this.ws.send("ping");
        }, 3000);
      };

      this.ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (!msg || !msg.transcript) return;

        const { transcript, end_of_turn } = msg;
        const dom = window.VoiceFlowAI?.notifications ? window.VoiceFlowAI : null;
        if (!dom) return;
        const liveTextEl = document.getElementById('live-text');
        const editor = document.getElementById('transcription-editor');

        if (!end_of_turn) {
          // Interim
          const styled = `<span style="color:#8892b0;font-style:italic;">${transcript}</span>`;
          liveTextEl.innerHTML = this.finalSoFar + styled;
          liveTextEl.scrollTop = liveTextEl.scrollHeight;
          return;
        }

        // Final
        const punctuate = (txt) => {
          const sr = window.VoiceFlowAI.speechRecognition;
          if (sr && window.VoiceFlowAI.appState.settings.autoPunctuation && typeof sr.addPunctuation === 'function') {
            return sr.addPunctuation(txt);
          }
          return txt;
        };

        const addText = punctuate(transcript);
        const needsSpace = editor.value && !editor.value.endsWith('\n') && !editor.value.endsWith(' ');
        editor.value += (needsSpace ? ' ' : '') + addText;
        window.VoiceFlowAI.textManager.updateWordCount();
        editor.scrollTop = editor.scrollHeight;

        this.finalSoFar = (this.finalSoFar ? this.finalSoFar + ' ' : '') + addText;
        liveTextEl.innerHTML = this.finalSoFar;
        liveTextEl.scrollTop = liveTextEl.scrollHeight;

        // history + confidence visuals
        const now = Date.now();
        window.VoiceFlowAI.appState.transcriptionHistory.push({ text: addText, confidence: 0.9, timestamp: now });
        window.VoiceFlowAI.appState.confidenceScore = 0.9;
        window.VoiceFlowAI.audioRecorder.updateConfidenceDisplay();
        const acc = document.getElementById('accuracy-score');
        if (acc) acc.textContent = `${Math.round(0.9 * 100)}%`;
      };

      this.ws.onclose = () => {
        this.connected = false;
        if (this.keepAlive) clearInterval(this.keepAlive);
        this.keepAlive = null;
        if (window.VoiceFlowAI?.notifications) {
          window.VoiceFlowAI.notifications.info("Disconnected from AssemblyAI");
        }
      };

      this.ws.onerror = () => {
        if (window.VoiceFlowAI?.notifications) {
          window.VoiceFlowAI.notifications.error("WebSocket error (AssemblyAI)");
        }
      };
    }

    disconnect() {
      if (this.keepAlive) clearInterval(this.keepAlive);
      this.keepAlive = null;
      if (this.ws && this.connected) this.ws.close();
      this.ws = null;
      this.connected = false;
      this.finalSoFar = "";
    }
  }

  function tryHook() {
    if (!window.VoiceFlowAI || !window.VoiceFlowAI.audioRecorder) {
      // app not ready yet
      return false;
    }

    const assemblyStream = new AssemblyAIStreamClient();
    window.VoiceFlowAI.assemblyStream = assemblyStream;

    const rec = window.VoiceFlowAI.audioRecorder;
    const appState = window.VoiceFlowAI.appState;
    const notifications = window.VoiceFlowAI.notifications;

    // wrap start
    const origStart = rec.start.bind(rec);
    rec.start = async function patchedStart() {
      const res = await origStart();
      // connect to AssemblyAI on start if mode allows
      const mode = (appState.settings.processingMode || 'hybrid').toLowerCase();
      if (mode === 'assemblyai' || mode === 'hybrid') {
        assemblyStream.connect();
        assemblyStream.finalSoFar = "";
      }
      if (res && notifications) notifications.info(`Recording started (${mode})`);
      return res;
    };

    // wrap stop
    const origStop = rec.stop.bind(rec);
    rec.stop = function patchedStop() {
      try {
        const mode = (appState.settings.processingMode || 'hybrid').toLowerCase();
        if (mode === 'assemblyai' || mode === 'hybrid') {
          assemblyStream.disconnect();
        }
      } finally {
        return origStop();
      }
    };

    // make hybrid the default if not set
    if (!appState.settings.processingMode) {
      appState.settings.processingMode = 'hybrid';
    }

    return true;
  }

  // wait for app to boot
  if (!tryHook()) {
    const iv = setInterval(() => {
      if (tryHook()) clearInterval(iv);
    }, 200);
    setTimeout(() => clearInterval(iv), 10000);
  }
})();
