// Anti-cheat utilities and detection mechanisms

export class AntiCheatMonitor {
  constructor(sessionDocId, onViolation) {
    this.sessionDocId = sessionDocId;
    this.onViolation = onViolation;
    this.keystrokePatterns = [];
    this.isMonitoring = false;
    this.focusStartTime = Date.now();
    this.lastKeystrokeTime = 0;
    this.suspiciousPatterns = [];
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.setupEventListeners();
    this.startFocusMonitoring();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.removeEventListeners();
  }

  setupEventListeners() {
    // Prevent copy/paste
    document.addEventListener('copy', this.handleCopyAttempt);
    document.addEventListener('paste', this.handlePasteAttempt);
    document.addEventListener('cut', this.handleCopyAttempt);
    
    // Monitor context menu (right-click)
    document.addEventListener('contextmenu', this.handleContextMenu);
    
    // Monitor keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Monitor visibility changes (tab switching)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Monitor window focus
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    
    // Monitor devtools (F12, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', this.handleDevToolsAttempt);
  }

  removeEventListeners() {
    document.removeEventListener('copy', this.handleCopyAttempt);
    document.removeEventListener('paste', this.handlePasteAttempt);
    document.removeEventListener('cut', this.handleCopyAttempt);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('keydown', this.handleDevToolsAttempt);
  }

  handleCopyAttempt = (e) => {
    e.preventDefault();
    this.recordViolation('copyAttempts');
    this.showWarning('Copying is not allowed during the exam!');
    return false;
  }

  handlePasteAttempt = (e) => {
    e.preventDefault();
    this.recordViolation('pasteAttempts');
    this.showWarning('Pasting is not allowed during the exam!');
    return false;
  }

  handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  }

  handleKeyDown = (e) => {
    const currentTime = Date.now();
    
    // Record keystroke timing
    if (this.lastKeystrokeTime > 0) {
      const timeDiff = currentTime - this.lastKeystrokeTime;
      this.keystrokePatterns.push(timeDiff);
      
      // Detect suspiciously fast typing (potential bot/script)
      if (timeDiff < 50 && this.keystrokePatterns.length > 10) {
        const recentPatterns = this.keystrokePatterns.slice(-10);
        const averageTime = recentPatterns.reduce((a, b) => a + b) / recentPatterns.length;
        
        if (averageTime < 80) {
          this.recordViolation('suspiciousKeystrokes');
          this.suspiciousPatterns.push({
            timestamp: currentTime,
            pattern: 'fast_typing',
            averageTime
          });
        }
      }
    }
    
    this.lastKeystrokeTime = currentTime;
  }

  handleDevToolsAttempt = (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')) {
      e.preventDefault();
      this.recordViolation('devTools');
      this.showWarning('Developer tools access is not allowed during the exam!');
      return false;
    }
  }

  handleVisibilityChange = () => {
    if (document.hidden) {
      this.recordViolation('tabSwitches');
      this.showWarning('Tab switching detected! Please stay on the exam page.');
    }
  }

  handleWindowBlur = () => {
    this.recordViolation('focusLost');
    this.showWarning('Please keep focus on the exam window.');
  }

  handleWindowFocus = () => {
    this.focusStartTime = Date.now();
  }

  startFocusMonitoring() {
    setInterval(() => {
      if (this.isMonitoring && !document.hasFocus()) {
        this.recordViolation('focusLost');
      }
    }, 5000); // Check every 5 seconds
  }

  recordViolation(type) {
    if (this.onViolation) {
      this.onViolation(type);
    }
  }

  showWarning(message) {
    // Create a warning overlay
    const warning = document.createElement('div');
    warning.className = 'anti-cheat-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <h3>⚠️ WARNING</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.parentElement.remove()">OK</button>
      </div>
    `;
    document.body.appendChild(warning);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (warning.parentElement) {
        warning.remove();
      }
    }, 5000);
  }

  getKeystrokeAnalysis() {
    if (this.keystrokePatterns.length < 10) {
      return { confidence: 'low', patterns: this.keystrokePatterns };
    }

    const avgTime = this.keystrokePatterns.reduce((a, b) => a + b) / this.keystrokePatterns.length;
    const variance = this.keystrokePatterns.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / this.keystrokePatterns.length;
    
    let confidence = 'medium';
    let humanLikelihood = 'likely';
    
    // Very consistent timing might indicate automated input
    if (variance < 100 && avgTime < 100) {
      confidence = 'high';
      humanLikelihood = 'unlikely';
    } else if (variance > 5000) {
      confidence = 'high';
      humanLikelihood = 'very_likely';
    }

    return {
      confidence,
      humanLikelihood,
      averageKeystrokeTime: avgTime,
      variance,
      totalKeystrokes: this.keystrokePatterns.length,
      suspiciousPatterns: this.suspiciousPatterns
    };
  }
}

// Utility function to detect if text was likely generated by AI
export function analyzeTextForAI(text) {
  const aiIndicators = [
    // Common AI phrases
    /as an ai/i,
    /i don't have personal/i,
    /i cannot provide/i,
    /it's important to note/i,
    /however, it's worth noting/i,
    /in conclusion/i,
    /furthermore/i,
    /nevertheless/i,
    /subsequently/i,
    
    // Overly formal patterns
    /moreover/gi,
    /consequently/gi,
    /therefore/gi,
    /additionally/gi,
    
    // Perfect structure patterns
    /firstly.*secondly.*thirdly/is,
    /on one hand.*on the other hand/is,
  ];

  let suspicionScore = 0;
  const detectedPatterns = [];

  aiIndicators.forEach(pattern => {
    if (pattern.test(text)) {
      suspicionScore += 1;
      detectedPatterns.push(pattern.toString());
    }
  });

  // Check for overly perfect grammar/structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    const avgSentenceLength = text.length / sentences.length;
    if (avgSentenceLength > 100) {
      suspicionScore += 0.5;
      detectedPatterns.push('long_sentences');
    }
  }

  // Check for lack of common human errors/informalities
  const humanMarkers = [
    /\b(um|uh|like|you know|i mean|actually|basically|literally)\b/gi,
    /[.,!?]{2,}/g, // Multiple punctuation
    /\b(gonna|wanna|kinda|sorta)\b/gi, // Contractions
  ];

  let humanScore = 0;
  humanMarkers.forEach(pattern => {
    if (pattern.test(text)) {
      humanScore += 1;
    }
  });

  return {
    suspicionScore,
    humanScore,
    detectedPatterns,
    likelihood: suspicionScore > 2 ? 'high' : suspicionScore > 1 ? 'medium' : 'low',
    recommendation: suspicionScore > 2 ? 'flag_for_review' : 'accept'
  };
}

// Function to disable text selection
export function disableTextSelection() {
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    
    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);
}

// Function to enable full-screen mode (must be called from user interaction)
export function requestFullscreen() {
  return new Promise((resolve, reject) => {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(resolve).catch(reject);
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
        resolve();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
        resolve();
      } else {
        reject(new Error('Fullscreen not supported'));
      }
    } else {
      resolve(); // Already in fullscreen
    }
  });
}

// Function to detect if user exits fullscreen
export function monitorFullscreen(onExitFullscreen) {
  function handleFullscreenChange() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) {
      onExitFullscreen();
    }
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);
}