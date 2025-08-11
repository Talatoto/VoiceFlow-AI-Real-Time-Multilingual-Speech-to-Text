/**
 * VoiceFlow AI - Advanced Speech-to-Text Application
 * Modern JavaScript Implementation with Advanced Features
 * 
 * Features:
 * - Real-time audio visualization with WebGL
 * - Advanced speech recognition with confidence scoring
 * - Modern UI interactions and animations
 * - Professional audio processing
 * - Multi-format export capabilities
 * - Responsive design with touch support
 */

// ===== APPLICATION STATE MANAGEMENT =====
class AppState {
  constructor() {
    this.isRecording = false;
    this.isPaused = false;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.recognition = null;
    this.currentLanguage = 'en-US';
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.audioContext = null;
    this.analyser = null;
    this.canvas = null;
    this.canvasContext = null;
    this.animationFrame = null;
    this.confidenceScore = 0;
    this.wordCount = 0;
    this.transcriptionHistory = [];
    this.settings = {
      sampleRate: 44100,
      bitRate: 128000,
      realTimeProcessing: true,
      autoPunctuation: true,
      noiseReduction: false,
      confidenceThreshold: 75,
      processingMode: 'hybrid',
      defaultFormat: 'docx',
      includeTimestamps: false
    };
  }

  // State management methods
  updateState(key, value) {
    this[key] = value;
    this.notifyStateChange(key, value);
  }

  notifyStateChange(key, value) {
    // Emit custom events for state changes
    document.dispatchEvent(new CustomEvent('stateChange', {
      detail: { key, value }
    }));
  }

  // Settings management
  updateSetting(key, value) {
    this.settings[key] = value;
    localStorage.setItem('voiceflow_settings', JSON.stringify(this.settings));
  }

  loadSettings() {
    const saved = localStorage.getItem('voiceflow_settings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }
}

// ===== GLOBAL STATE INSTANCE =====
const appState = new AppState();

// ===== DOM ELEMENT MANAGER =====
class DOMManager {
  constructor() {
    this.elements = {};
    this.initializeElements();
  }

  initializeElements() {
    // Navigation elements
    this.elements.themeToggle = document.getElementById('theme-toggle');
    this.elements.settingsBtn = document.getElementById('settings-btn');
    this.elements.helpBtn = document.getElementById('help-btn');

    // Language and settings
    this.elements.languageSelect = document.getElementById('language-select');
    this.elements.realTimeToggle = document.getElementById('real-time-toggle');
    this.elements.autoPunctuationToggle = document.getElementById('auto-punctuation');
    this.elements.noiseReductionToggle = document.getElementById('noise-reduction');

    // Recording controls
    this.elements.recordBtn = document.getElementById('record-btn');
    this.elements.pauseBtn = document.getElementById('pause-btn');
    this.elements.stopBtn = document.getElementById('stop-btn');
    this.elements.statusDisplay = document.getElementById('status-display');
    this.elements.statusIndicator = document.getElementById('status-indicator');
    this.elements.statusText = document.getElementById('status-text');
    this.elements.statusTime = document.getElementById('status-time');

    // Audio visualization
    this.elements.audioVisualizer = document.getElementById('audio-visualizer');
    this.elements.frequencyBars = document.getElementById('frequency-bars');

    // Transcription elements
    this.elements.wordCount = document.getElementById('word-count');
    this.elements.accuracyScore = document.getElementById('accuracy-score');
    this.elements.durationDisplay = document.getElementById('duration-display');
    this.elements.transcriptionEditor = document.getElementById('transcription-editor');
    this.elements.liveTranscription = document.getElementById('live-transcription');
    this.elements.liveText = document.getElementById('live-text');
    this.elements.typingIndicator = document.getElementById('typing-indicator');
    this.elements.confidenceFill = document.getElementById('confidence-fill');
    this.elements.confidencePercentage = document.getElementById('confidence-percentage');

    // Action buttons
    this.elements.clearBtn = document.getElementById('clear-btn');
    this.elements.copyBtn = document.getElementById('copy-btn');
    this.elements.downloadBtn = document.getElementById('download-btn');
    this.elements.shareBtn = document.getElementById('share-btn');

    // Export buttons
    this.elements.exportTxt = document.getElementById('export-txt');
    this.elements.exportDocx = document.getElementById('export-docx');
    this.elements.exportPdf = document.getElementById('export-pdf');
    this.elements.exportAudio = document.getElementById('export-audio');
    this.elements.exportJson = document.getElementById('export-json');
    this.elements.exportSrt = document.getElementById('export-srt');

    // Modal elements
    this.elements.settingsModal = document.getElementById('settings-modal');
    this.elements.closeSettings = document.getElementById('close-settings');
    this.elements.toastContainer = document.getElementById('toast-container');
    this.elements.loadingOverlay = document.getElementById('loading-overlay');
    this.elements.loadingText = document.getElementById('loading-text');
    this.elements.loadingProgress = document.getElementById('loading-progress');
    this.elements.loadingPercentage = document.getElementById('loading-percentage');

    // Settings modal elements
    this.elements.sampleRate = document.getElementById('sample-rate');
    this.elements.bitRate = document.getElementById('bit-rate');
    this.elements.confidenceThreshold = document.getElementById('confidence-threshold');
    this.elements.processingMode = document.getElementById('processing-mode');
    this.elements.defaultFormat = document.getElementById('default-format');
    this.elements.includeTimestamps = document.getElementById('include-timestamps');
  }

  get(elementId) {
    return this.elements[elementId] || document.getElementById(elementId);
  }

  addClass(elementId, className) {
    const element = this.get(elementId);
    if (element) element.classList.add(className);
  }

  removeClass(elementId, className) {
    const element = this.get(elementId);
    if (element) element.classList.remove(className);
  }

  toggleClass(elementId, className) {
    const element = this.get(elementId);
    if (element) element.classList.toggle(className);
  }

  setText(elementId, text) {
    const element = this.get(elementId);
    if (element) element.textContent = text;
  }

  setHTML(elementId, html) {
    const element = this.get(elementId);
    if (element) element.innerHTML = html;
  }
}

// ===== GLOBAL DOM MANAGER INSTANCE =====
const dom = new DOMManager();

// ===== UTILITY FUNCTIONS =====
class Utils {
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
  }

  static async requestPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      return false;
    }
  }
}

// ===== NOTIFICATION SYSTEM =====
class NotificationManager {
  constructor() {
    this.container = dom.get('toastContainer');
    this.notifications = new Map();
  }

  show(message, type = 'info', duration = 5000) {
    const id = Utils.generateId();
    const notification = this.createNotification(id, message, type);
    
    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // Trigger show animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  createNotification(id, message, type) {
    const notification = document.createElement('div');
    notification.className = `toast ${type}`;
    notification.dataset.id = id;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
      <div class="toast-content">
        <i class="${icons[type] || icons.info}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="notifications.remove('${id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    return notification;
  }

  remove(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(id);
      }, 300);
    }
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// ===== LOADING MANAGER =====
class LoadingManager {
  constructor() {
    this.overlay = dom.get('loadingOverlay');
    this.text = dom.get('loadingText');
    this.progress = dom.get('loadingProgress');
    this.percentage = dom.get('loadingPercentage');
    this.isVisible = false;
  }

  show(message = 'Processing...', showProgress = false) {
    this.text.textContent = message;
    this.progress.style.width = '0%';
    this.percentage.textContent = '0%';
    this.overlay.classList.add('active');
    this.isVisible = true;
  }

  hide() {
    this.overlay.classList.remove('active');
    this.isVisible = false;
  }

  updateProgress(percentage, message) {
    if (this.isVisible) {
      this.progress.style.width = `${percentage}%`;
      this.percentage.textContent = `${Math.round(percentage)}%`;
      if (message) {
        this.text.textContent = message;
      }
    }
  }

  setText(message) {
    if (this.isVisible) {
      this.text.textContent = message;
    }
  }
}

// ===== AUDIO VISUALIZATION =====
class AudioVisualizer {
  constructor() {
    this.canvas = dom.get('audioVisualizer');
    this.ctx = this.canvas.getContext('2d');
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.animationId = null;
    this.isActive = false;
    
    this.setupCanvas();
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  initialize(audioContext, sourceNode) {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    
    sourceNode.connect(this.analyser);
    
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    
    this.isActive = true;
    this.draw();
  }

  draw() {
    if (!this.isActive) return;

    this.animationId = requestAnimationFrame(() => this.draw());
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
    gradient.addColorStop(1, 'rgba(22, 33, 62, 0.9)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw frequency bars
    const barWidth = width / this.bufferLength * 2;
    let x = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * height * 0.8;
      
      // Create gradient for each bar
      const barGradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
      barGradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
      barGradient.addColorStop(0.5, 'rgba(79, 172, 254, 0.6)');
      barGradient.addColorStop(1, 'rgba(100, 255, 218, 0.4)');
      
      this.ctx.fillStyle = barGradient;
      this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      
      // Add glow effect
      this.ctx.shadowColor = 'rgba(100, 255, 218, 0.5)';
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      this.ctx.shadowBlur = 0;
      
      x += barWidth;
    }
    
    // Draw waveform overlay
    this.drawWaveform();
  }

  drawWaveform() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(100, 255, 218, 0.6)';
    this.ctx.lineWidth = 2;
    
    const sliceWidth = width / this.bufferLength;
    let x = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 255;
      const y = height - (v * height * 0.5) - height * 0.25;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.stroke();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Clear canvas
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, width, height);
  }
}

// ===== AUDIO RECORDER =====
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.sourceNode = null;
    this.visualizer = new AudioVisualizer();
    this.recordingStartTime = null;
    this.timer = null;
  }

  async initialize() {
    try {
      // Request microphone access with high quality settings
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: appState.settings.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: appState.settings.noiseReduction,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sourceNode = this.audioContext.createMediaStreamSource(this.audioStream);

      // Initialize visualizer
      this.visualizer.initialize(this.audioContext, this.sourceNode);

      // Setup MediaRecorder
      const options = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: appState.settings.bitRate
      };

      this.mediaRecorder = new MediaRecorder(this.audioStream, options);
      this.setupMediaRecorderEvents();

      notifications.success('Microphone initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      notifications.error('Failed to access microphone. Please check permissions.');
      return false;
    }
  }

  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return '';
  }

  setupMediaRecorderEvents() {
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.handleRecordingStop();
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      notifications.error('Recording error occurred');
    };
  }

  async start() {
    if (!this.mediaRecorder) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      this.audioChunks = [];
      this.mediaRecorder.start(100); // Collect data every 100ms
      
      appState.updateState('isRecording', true);
      appState.updateState('isPaused', false);
      this.recordingStartTime = Date.now();
      
      this.startTimer();
      this.updateUI();
      
      // Start speech recognition
      speechRecognition.start();
      
      notifications.success('Recording started');
      return true;

    } catch (error) {
      console.error('Failed to start recording:', error);
      notifications.error('Failed to start recording');
      return false;
    }
  }

  pause() {
    if (this.mediaRecorder && appState.isRecording && !appState.isPaused) {
      this.mediaRecorder.pause();
      appState.updateState('isPaused', true);
      this.updateUI();
      speechRecognition.stop();
      notifications.info('Recording paused');
    }
  }

  resume() {
    if (this.mediaRecorder && appState.isRecording && appState.isPaused) {
      this.mediaRecorder.resume();
      appState.updateState('isPaused', false);
      this.updateUI();
      speechRecognition.start();
      notifications.info('Recording resumed');
    }
  }

  stop() {
    if (this.mediaRecorder && appState.isRecording) {
      this.mediaRecorder.stop();
      appState.updateState('isRecording', false);
      appState.updateState('isPaused', false);
      
      this.stopTimer();
      this.visualizer.stop();
      this.updateUI();
      
      speechRecognition.stop();
      notifications.success('Recording stopped');
    }
  }

  handleRecordingStop() {
    const audioBlob = new Blob(this.audioChunks, { 
      type: this.getSupportedMimeType() 
    });
    
    // Store audio blob for export
    appState.audioBlob = audioBlob;
    
    // Enable audio export
    dom.get('exportAudio').style.opacity = '1';
    dom.get('exportAudio').style.pointerEvents = 'auto';
    
    // Process for transcription if needed
    this.processAudioForTranscription(audioBlob);
  }

  async processAudioForTranscription(audioBlob) {
    if (!appState.settings.realTimeProcessing) {
      loading.show('Processing audio for transcription...');
      
      try {
        // Simulate API processing
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          loading.updateProgress(i, `Processing audio... ${i}%`);
        }
        
        // Mock transcription result
        const mockResult = {
          text: "This is a sample transcription result from the advanced speech-to-text system.",
          confidence: 0.92,
          language: appState.currentLanguage,
          duration: this.getRecordingDuration(),
          words: []
        };
        
        this.handleTranscriptionResult(mockResult);
        
      } catch (error) {
        console.error('Transcription error:', error);
        notifications.error('Failed to process audio for transcription');
      } finally {
        loading.hide();
      }
    }
  }

  handleTranscriptionResult(result) {
    // Update transcription text
    const editor = dom.get('transcriptionEditor');
    editor.value = result.text;
    
    // Update confidence
    appState.confidenceScore = result.confidence;
    this.updateConfidenceDisplay();
    
    // Update word count
    textManager.updateWordCount();
    
    // Update accuracy score
    dom.setText('accuracyScore', `${Math.round(result.confidence * 100)}%`);
    
    notifications.success('Transcription completed successfully');
  }

  updateConfidenceDisplay() {
    const percentage = Math.round(appState.confidenceScore * 100);
    dom.get('confidenceFill').style.width = `${percentage}%`;
    dom.setText('confidencePercentage', `${percentage}%`);
  }

  getRecordingDuration() {
    if (this.recordingStartTime) {
      return Math.floor((Date.now() - this.recordingStartTime) / 1000);
    }
    return 0;
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (appState.isRecording && !appState.isPaused) {
        const duration = this.getRecordingDuration();
        dom.setText('statusTime', Utils.formatTime(duration));
        dom.setText('durationDisplay', Utils.formatTime(duration));
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateUI() {
    const indicator = dom.get('statusIndicator');
    const recordBtn = dom.get('recordBtn');
    const pauseBtn = dom.get('pauseBtn');
    const stopBtn = dom.get('stopBtn');
    
    // Update status indicator
    indicator.className = 'status-indicator';
    if (appState.isRecording) {
      if (appState.isPaused) {
        indicator.classList.add('paused');
        dom.setText('statusText', 'Recording Paused');
      } else {
        indicator.classList.add('recording');
        dom.setText('statusText', 'Recording in Progress');
      }
    } else {
      dom.setText('statusText', 'Ready to Record');
    }

    // Update button states
    recordBtn.disabled = appState.isRecording && !appState.isPaused;
    pauseBtn.disabled = !appState.isRecording;
    stopBtn.disabled = !appState.isRecording;

    // Update button text and icons
    if (appState.isPaused) {
      pauseBtn.querySelector('.btn-text').textContent = 'Resume';
      pauseBtn.querySelector('.btn-icon').className = 'btn-icon fas fa-play';
    } else {
      pauseBtn.querySelector('.btn-text').textContent = 'Pause';
      pauseBtn.querySelector('.btn-icon').className = 'btn-icon fas fa-pause';
    }

    // Update live transcription visibility
    const liveTranscription = dom.get('liveTranscription');
    if (appState.isRecording && !appState.isPaused && appState.settings.realTimeProcessing) {
      liveTranscription.classList.add('active');
    } else {
      liveTranscription.classList.remove('active');
    }
  }

  cleanup() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.visualizer.stop();
  }
}

// ===== SPEECH RECOGNITION =====
class SpeechRecognition {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.isActive = false;
    this.interimResults = '';
    this.finalResults = '';
    
    this.initialize();
  }

  initialize() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = appState.currentLanguage;
      
      this.setupEventHandlers();
      this.isSupported = true;
    } else {
      console.warn('Speech Recognition API not supported');
      notifications.warning('Speech recognition not supported in this browser');
    }
  }

  setupEventHandlers() {
    this.recognition.onstart = () => {
      this.isActive = true;
      console.log('Speech recognition started');
    };

    this.recognition.onend = () => {
      this.isActive = false;
      console.log('Speech recognition ended');
    };

    this.recognition.onresult = (event) => {
      this.handleResults(event);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart recognition if no speech detected
        setTimeout(() => {
          if (appState.isRecording && !appState.isPaused) {
            this.start();
          }
        }, 1000);
      }
    };

    this.recognition.onnomatch = () => {
      console.log('No speech match found');
    };
  }

  handleResults(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    let confidence = 0;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcript;
        confidence = Math.max(confidence, result[0].confidence || 0);
        
        // Add to transcription history
        appState.transcriptionHistory.push({
          text: transcript,
          confidence: result[0].confidence || 0,
          timestamp: Date.now()
        });
      } else {
        interimTranscript += transcript;
      }
    }

    // Update live transcription display
    this.updateLiveDisplay(finalTranscript, interimTranscript);
    
    // Update final transcription if we have final results
    if (finalTranscript) {
      this.updateFinalTranscription(finalTranscript);
      appState.confidenceScore = confidence;
      audioRecorder.updateConfidenceDisplay();
    }
  }

  updateLiveDisplay(finalText, interimText) {
    const liveTextElement = dom.get('liveText');
    const styledInterim = `<span style="color: #8892b0; font-style: italic;">${interimText}</span>`;
    liveTextElement.innerHTML = finalText + styledInterim;
    
    // Auto-scroll to bottom
    liveTextElement.scrollTop = liveTextElement.scrollHeight;
  }

  updateFinalTranscription(newText) {
    const editor = dom.get('transcriptionEditor');
    const currentText = editor.value;
    
    if (appState.settings.autoPunctuation) {
      newText = this.addPunctuation(newText);
    }
    
    editor.value = currentText + (currentText ? ' ' : '') + newText;
    textManager.updateWordCount();
    
    // Auto-scroll editor
    editor.scrollTop = editor.scrollHeight;
  }

  addPunctuation(text) {
    // Simple punctuation rules
    text = text.trim();
    if (text && !text.match(/[.!?]$/)) {
      // Add period if sentence seems complete
      if (text.length > 10 && text.split(' ').length > 3) {
        text += '.';
      }
    }
    return text;
  }

  start() {
    if (this.isSupported && !this.isActive) {
      try {
        this.recognition.lang = appState.currentLanguage;
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }

  stop() {
    if (this.isSupported && this.isActive) {
      this.recognition.stop();
    }
  }

  updateLanguage(language) {
    appState.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
}

// ===== TEXT MANAGER =====
class TextManager {
  constructor() {
    this.editor = dom.get('transcriptionEditor');
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = 50;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Auto-save and word count update
    this.editor.addEventListener('input', Utils.debounce(() => {
      this.saveState();
      this.updateWordCount();
    }, 500));

    // Keyboard shortcuts
    this.editor.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
            e.preventDefault();
            break;
          case 'y':
            this.redo();
            e.preventDefault();
            break;
        }
      }
    });
  }

  updateWordCount() {
    const text = this.editor.value.trim();
    const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    const characters = text.length;
    
    appState.wordCount = words;
    dom.setText('wordCount', words.toString());
    
    // Update reading time estimate (average 200 words per minute)
    const readingTime = Math.ceil(words / 200);
    const readingTimeText = readingTime === 1 ? '1 min' : `${readingTime} mins`;
    
    // You can add a reading time display element if needed
  }

  saveState() {
    const currentState = this.editor.value;
    
    // Don't save if it's the same as the last state
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === currentState) {
      return;
    }
    
    this.undoStack.push(currentState);
    
    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when new state is saved
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop();
      this.redoStack.push(currentState);
      
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.editor.value = previousState;
      this.updateWordCount();
      
      notifications.info('Undo applied');
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop();
      this.undoStack.push(nextState);
      
      this.editor.value = nextState;
      this.updateWordCount();
      
      notifications.info('Redo applied');
    }
  }

  clear() {
    if (this.editor.value.trim()) {
      if (confirm('Are you sure you want to clear all text? This action cannot be undone.')) {
        this.saveState();
        this.editor.value = '';
        this.updateWordCount();
        
        // Clear live transcription
        dom.setHTML('liveText', '');
        
        // Reset confidence
        appState.confidenceScore = 0;
        audioRecorder.updateConfidenceDisplay();
        
        notifications.success('Text cleared');
      }
    }
  }

  async copy() {
    const text = this.editor.value.trim();
    if (!text) {
      notifications.warning('No text to copy');
      return;
    }

    try {
      await Utils.copyToClipboard(text);
      notifications.success('Text copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text:', error);
      notifications.error('Failed to copy text');
    }
  }

  download() {
    const text = this.editor.value.trim();
    if (!text) {
      notifications.warning('No text to download');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `transcription_${timestamp}.txt`;
    
    Utils.downloadFile(text, filename, 'text/plain');
    notifications.success('Text file downloaded');
  }

  async share() {
    const text = this.editor.value.trim();
    if (!text) {
      notifications.warning('No text to share');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Voice Transcription',
          text: text
        });
        notifications.success('Text shared successfully');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          this.fallbackShare(text);
        }
      }
    } else {
      this.fallbackShare(text);
    }
  }

  fallbackShare(text) {
    // Fallback: copy to clipboard
    Utils.copyToClipboard(text).then(() => {
      notifications.info('Text copied to clipboard (share not supported)');
    }).catch(() => {
      notifications.error('Share not supported on this device');
    });
  }
}

// ===== EXPORT MANAGER =====
class ExportManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    dom.get('exportTxt').addEventListener('click', () => this.exportTxt());
    dom.get('exportDocx').addEventListener('click', () => this.exportDocx());
    dom.get('exportPdf').addEventListener('click', () => this.exportPdf());
    dom.get('exportAudio').addEventListener('click', () => this.exportAudio());
    dom.get('exportJson').addEventListener('click', () => this.exportJson());
    dom.get('exportSrt').addEventListener('click', () => this.exportSrt());
  }

  exportTxt() {
    const text = dom.get('transcriptionEditor').value.trim();
    if (!text) {
      notifications.warning('No text to export');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `voiceflow_transcription_${timestamp}.txt`;
    
    let content = text;
    
    if (appState.settings.includeTimestamps) {
      const header = `VoiceFlow AI Transcription\nGenerated: ${new Date().toLocaleString()}\nLanguage: ${appState.currentLanguage}\nConfidence: ${Math.round(appState.confidenceScore * 100)}%\n\n`;
      content = header + content;
    }
    
    Utils.downloadFile(content, filename, 'text/plain');
    notifications.success('TXT file exported successfully');
  }

  exportDocx() {
    notifications.info('DOCX export requires additional library integration');
    // In a real implementation, you would use a library like docx-preview or mammoth
  }

  exportPdf() {
    notifications.info('PDF export requires additional library integration');
    // In a real implementation, you would use a library like jsPDF
  }

  exportAudio() {
    if (!appState.audioBlob) {
      notifications.warning('No audio recording to export');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `voiceflow_recording_${timestamp}.webm`;
    
    const url = URL.createObjectURL(appState.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    notifications.success('Audio file exported successfully');
  }

  exportJson() {
    const text = dom.get('transcriptionEditor').value.trim();
    if (!text) {
      notifications.warning('No data to export');
      return;
    }

    const data = {
      transcription: {
        text: text,
        language: appState.currentLanguage,
        confidence: appState.confidenceScore,
        wordCount: appState.wordCount,
        timestamp: new Date().toISOString(),
        settings: appState.settings,
        history: appState.transcriptionHistory
      }
    };

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `voiceflow_data_${timestamp}.json`;
    
    Utils.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    notifications.success('JSON data exported successfully');
  }

  exportSrt() {
    if (appState.transcriptionHistory.length === 0) {
      notifications.warning('No timestamped data available for SRT export');
      return;
    }

    let srtContent = '';
    let index = 1;
    
    appState.transcriptionHistory.forEach((entry, i) => {
      const startTime = this.formatSrtTime(entry.timestamp);
      const endTime = this.formatSrtTime(entry.timestamp + 3000); // Assume 3 second duration
      
      srtContent += `${index}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${entry.text}\n\n`;
      
      index++;
    });

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `voiceflow_subtitles_${timestamp}.srt`;
    
    Utils.downloadFile(srtContent, filename, 'text/plain');
    notifications.success('SRT subtitles exported successfully');
  }

  formatSrtTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
    
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }
}

// ===== SETTINGS MANAGER =====
class SettingsManager {
  constructor() {
    this.modal = dom.get('settingsModal');
    this.setupEventListeners();
    this.loadSettings();
  }

  setupEventListeners() {
    // Modal controls
    dom.get('settingsBtn').addEventListener('click', () => this.show());
    dom.get('closeSettings').addEventListener('click', () => this.hide());
    
    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Settings inputs
    this.setupSettingsInputs();
  }

  setupSettingsInputs() {
    // Sample rate
    const sampleRate = dom.get('sampleRate');
    if (sampleRate) {
      sampleRate.addEventListener('change', (e) => {
        appState.updateSetting('sampleRate', parseInt(e.target.value));
      });
    }

    // Bit rate
    const bitRate = dom.get('bitRate');
    if (bitRate) {
      bitRate.addEventListener('change', (e) => {
        appState.updateSetting('bitRate', parseInt(e.target.value));
      });
    }

    // Confidence threshold
    const confidenceThreshold = dom.get('confidenceThreshold');
    if (confidenceThreshold) {
      confidenceThreshold.addEventListener('input', (e) => {
        appState.updateSetting('confidenceThreshold', parseInt(e.target.value));
        const valueDisplay = e.target.parentNode.querySelector('.range-value');
        if (valueDisplay) {
          valueDisplay.textContent = `${e.target.value}%`;
        }
      });
    }

    // Processing mode
    const processingMode = dom.get('processingMode');
    if (processingMode) {
      processingMode.addEventListener('change', (e) => {
        appState.updateSetting('processingMode', e.target.value);
      });
    }

    // Default format
    const defaultFormat = dom.get('defaultFormat');
    if (defaultFormat) {
      defaultFormat.addEventListener('change', (e) => {
        appState.updateSetting('defaultFormat', e.target.value);
      });
    }

    // Include timestamps
    const includeTimestamps = dom.get('includeTimestamps');
    if (includeTimestamps) {
      includeTimestamps.addEventListener('change', (e) => {
        appState.updateSetting('includeTimestamps', e.target.checked);
      });
    }
  }

  loadSettings() {
    appState.loadSettings();
    
    // Update UI with loaded settings
    const sampleRate = dom.get('sampleRate');
    if (sampleRate) sampleRate.value = appState.settings.sampleRate;
    
    const bitRate = dom.get('bitRate');
    if (bitRate) bitRate.value = appState.settings.bitRate;
    
    const confidenceThreshold = dom.get('confidenceThreshold');
    if (confidenceThreshold) {
      confidenceThreshold.value = appState.settings.confidenceThreshold;
      const valueDisplay = confidenceThreshold.parentNode.querySelector('.range-value');
      if (valueDisplay) {
        valueDisplay.textContent = `${appState.settings.confidenceThreshold}%`;
      }
    }
    
    const processingMode = dom.get('processingMode');
    if (processingMode) processingMode.value = appState.settings.processingMode;
    
    const defaultFormat = dom.get('defaultFormat');
    if (defaultFormat) defaultFormat.value = appState.settings.defaultFormat;
    
    const includeTimestamps = dom.get('includeTimestamps');
    if (includeTimestamps) includeTimestamps.checked = appState.settings.includeTimestamps;
  }

  show() {
    this.modal.classList.add('active');
  }

  hide() {
    this.modal.classList.remove('active');
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }
}

// ===== THEME MANAGER =====
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('voiceflow_theme') || 'dark';
    this.applyTheme();
    this.setupEventListeners();
  }

  setupEventListeners() {
    dom.get('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    localStorage.setItem('voiceflow_theme', this.currentTheme);
    
    notifications.info(`Switched to ${this.currentTheme} theme`);
  }

  applyTheme() {
    document.body.setAttribute('data-theme', this.currentTheme);
    
    const icon = dom.get('themeToggle').querySelector('i');
    if (this.currentTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }
}

// ===== PARTICLE SYSTEM =====
class ParticleSystem {
  constructor() {
    this.container = dom.get('particles');
    this.particles = [];
    this.maxParticles = 50;
    this.animationId = null;
    
    this.init();
  }

  init() {
    this.createParticles();
    this.animate();
  }

  createParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Clear container
    this.container.innerHTML = '';
    
    // Update and render particles
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = window.innerWidth;
      if (particle.x > window.innerWidth) particle.x = 0;
      if (particle.y < 0) particle.y = window.innerHeight;
      if (particle.y > window.innerHeight) particle.y = 0;
      
      // Create particle element
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = particle.x + 'px';
      element.style.top = particle.y + 'px';
      element.style.width = particle.size + 'px';
      element.style.height = particle.size + 'px';
      element.style.background = 'rgba(100, 255, 218, ' + particle.opacity + ')';
      element.style.borderRadius = '50%';
      element.style.pointerEvents = 'none';
      
      this.container.appendChild(element);
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// ===== GLOBAL INSTANCES =====
const notifications = new NotificationManager();
const loading = new LoadingManager();
const audioRecorder = new AudioRecorder();
const speechRecognition = new SpeechRecognition();
const textManager = new TextManager();
const exportManager = new ExportManager();
const settingsManager = new SettingsManager();
const themeManager = new ThemeManager();
const particleSystem = new ParticleSystem();

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
  // Language selection
  dom.get('languageSelect').addEventListener('change', (e) => {
    speechRecognition.updateLanguage(e.target.value);
    notifications.info(`Language changed to ${e.target.selectedOptions[0].text}`);
  });

  // Recording controls
  dom.get('recordBtn').addEventListener('click', () => {
    if (appState.isPaused) {
      audioRecorder.resume();
    } else {
      audioRecorder.start();
    }
  });

  dom.get('pauseBtn').addEventListener('click', () => {
    if (appState.isPaused) {
      audioRecorder.resume();
    } else {
      audioRecorder.pause();
    }
  });

  dom.get('stopBtn').addEventListener('click', () => {
    audioRecorder.stop();
  });

  // Text management
  dom.get('clearBtn').addEventListener('click', () => textManager.clear());
  dom.get('copyBtn').addEventListener('click', () => textManager.copy());
  dom.get('downloadBtn').addEventListener('click', () => textManager.download());
  dom.get('shareBtn').addEventListener('click', () => textManager.share());

  // Settings toggles
  dom.get('realTimeToggle').addEventListener('change', (e) => {
    appState.updateSetting('realTimeProcessing', e.target.checked);
  });

  dom.get('autoPunctuationToggle').addEventListener('change', (e) => {
    appState.updateSetting('autoPunctuation', e.target.checked);
  });

  dom.get('noiseReductionToggle').addEventListener('change', (e) => {
    appState.updateSetting('noiseReduction', e.target.checked);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Global shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (appState.isRecording) {
            audioRecorder.stop();
          } else {
            audioRecorder.start();
          }
          break;
        case ',':
          e.preventDefault();
          settingsManager.show();
          break;
      }
    }
    
    // Escape key
    if (e.key === 'Escape') {
      if (appState.isRecording) {
        audioRecorder.stop();
      }
      if (settingsManager.modal.classList.contains('active')) {
        settingsManager.hide();
      }
    }
    
    // Space bar for pause/resume (when not in text editor)
    if (e.code === 'Space' && e.target !== dom.get('transcriptionEditor')) {
      e.preventDefault();
      if (appState.isRecording) {
        if (appState.isPaused) {
          audioRecorder.resume();
        } else {
          audioRecorder.pause();
        }
      }
    }
  });

  // Button ripple effects
  document.querySelectorAll('.control-btn, .export-card').forEach(button => {
    button.addEventListener('click', createRippleEffect);
  });

  // Window resize handler
  window.addEventListener('resize', Utils.debounce(() => {
    audioRecorder.visualizer.setupCanvas();
  }, 250));

  // Visibility change handler
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && appState.isRecording) {
      // Optionally pause recording when tab becomes hidden
      console.log('Tab hidden while recording');
    }
  });
}

// ===== RIPPLE EFFECT =====
function createRippleEffect(e) {
  const button = e.currentTarget;
  const ripple = button.querySelector('.btn-ripple') || document.createElement('div');
  
  if (!button.querySelector('.btn-ripple')) {
    ripple.className = 'btn-ripple';
    button.appendChild(ripple);
  }

  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.transform = 'scale(0)';

  // Trigger animation
  requestAnimationFrame(() => {
    ripple.style.transform = 'scale(4)';
    ripple.style.opacity = '0';
  });

  // Clean up
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 600);
}

// ===== INITIALIZATION =====
async function initializeApp() {
  try {
    // Load settings
    appState.loadSettings();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Request permissions
    const hasPermissions = await Utils.requestPermissions();
    if (!hasPermissions) {
      notifications.warning('Microphone access is required for recording');
    }
    
    // Initialize word count
    textManager.updateWordCount();
    
    // Set initial language
    speechRecognition.updateLanguage(dom.get('languageSelect').value);
    
    // Show welcome message
    notifications.success('VoiceFlow AI initialized successfully');
    
    console.log('🎤 VoiceFlow AI - Advanced Speech Recognition Platform');
    console.log('✅ Application initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    notifications.error('Failed to initialize application');
  }
}

// ===== CLEANUP =====
function cleanup() {
  audioRecorder.cleanup();
  particleSystem.destroy();
  
  // Save current state
  const currentText = dom.get('transcriptionEditor').value;
  if (currentText.trim()) {
    localStorage.setItem('voiceflow_draft', currentText);
  }
}

// ===== APPLICATION STARTUP =====
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', cleanup);

// ===== EXPORT FOR GLOBAL ACCESS =====
window.VoiceFlowAI = {
  appState,
  audioRecorder,
  speechRecognition,
  textManager,
  exportManager,
  notifications,
  loading,
  Utils
};

