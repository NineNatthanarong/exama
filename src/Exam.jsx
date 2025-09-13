import React, { useState, useEffect, useRef } from 'react';
import { ExamService } from './examService';
import { AntiCheatMonitor, analyzeTextForAI, disableTextSelection, requestFullscreen, monitorFullscreen } from './antiCheat';
import './Exam.css';

const Exam = ({ exam, examSession, onExamComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [antiCheatMonitor, setAntiCheatMonitor] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [fullscreenRequested, setFullscreenRequested] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations] = useState(3);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Initialize anti-cheat monitoring
    const monitor = new AntiCheatMonitor(
      examSession.id,
      (violationType) => recordAntiCheatViolation(violationType)
    );
    
    setAntiCheatMonitor(monitor);
    monitor.startMonitoring();

    // Disable text selection
    disableTextSelection();

    // Monitor fullscreen exit (but don't request fullscreen automatically)
    monitorFullscreen(() => {
      // Only add warning for fullscreen exit, don't double-count violations
      // Focus lost violations are already handled by AntiCheatMonitor
      addWarning('Please return to fullscreen mode for the exam.');
    });

    // Load existing answers if any
    if (examSession.responses) {
      setAnswers(examSession.responses);
      // Find the first unanswered question
      const answeredQuestions = Object.keys(examSession.responses);
      for (let i = 0; i < exam.questions.length; i++) {
        if (!answeredQuestions.includes(i.toString())) {
          setCurrentQuestionIndex(i);
          break;
        }
      }
    }

    return () => {
      if (monitor) {
        monitor.stopMonitoring();
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmitExam();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentAnswer.trim() && !isSubmitted) {
        saveCurrentAnswer();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentAnswer, currentQuestionIndex, isSubmitted]);

  const recordAntiCheatViolation = async (violationType) => {
    try {
      await ExamService.recordAntiCheatViolation(examSession.id, violationType);
      
      // Increment violation count using functional update
      setViolationCount(prevCount => {
        const newViolationCount = prevCount + 1;
        
        // Map violation types to user-friendly messages
        const violationMessages = {
          'tabSwitches': 'Tab switching detected',
          'focusLost': 'Window focus lost',
          'copyAttempts': 'Copy attempt detected',
          'pasteAttempts': 'Paste attempt detected',
          'suspiciousKeystrokes': 'Suspicious typing pattern',
          'contextMenu': 'Right-click menu blocked',
          'devTools': 'Developer tools blocked'
        };
        
        const message = violationMessages[violationType] || violationType;
        
        // Show warning without count (count is shown in violations counter)
        addWarning(`Security violation: ${message}`);
        
        // Auto-submit exam if maximum violations reached
        if (newViolationCount >= maxViolations) {
          addWarning('Maximum violations reached. Exam will be submitted automatically.');
          setTimeout(() => {
            handleSubmitExam();
          }, 2000); // Give user 2 seconds to see the final warning
        }
        
        return newViolationCount;
      });
    } catch (error) {
      console.error('Error recording anti-cheat violation:', error);
    }
  };

  const addWarning = (message) => {
    setWarnings(prev => [...prev, { message, timestamp: new Date() }]);
  };

  const saveCurrentAnswer = async () => {
    if (!currentAnswer.trim()) return;

    try {
      // Analyze text for AI-generated content
      const aiAnalysis = analyzeTextForAI(currentAnswer);
      
      // Get keystroke analysis
      const keystrokeAnalysis = antiCheatMonitor ? antiCheatMonitor.getKeystrokeAnalysis() : null;

      const responseData = {
        answer: currentAnswer,
        aiAnalysis,
        keystrokeAnalysis,
        timestamp: new Date(),
        questionIndex: currentQuestionIndex
      };

      await ExamService.saveResponse(
        examSession.id,
        currentQuestionIndex,
        currentAnswer,
        keystrokeAnalysis
      );

      // Update local state
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: responseData
      }));

      // Flag suspicious content
      if (aiAnalysis.likelihood === 'high') {
        recordAntiCheatViolation('suspiciousKeystrokes');
        addWarning('Suspicious content detected. Please ensure all answers are your own work.');
      }

    } catch (error) {
      console.error('Error saving answer:', error);
      addWarning('Error saving answer. Please try again.');
    }
  };

  const handleAnswerChange = (value) => {
    setCurrentAnswer(value);
    
    // Request fullscreen on first interaction if not already requested
    if (!fullscreenRequested) {
      setFullscreenRequested(true);
      requestFullscreen().catch(() => {
        // Ignore fullscreen errors - not critical for exam functionality
        console.log('Fullscreen request failed - continuing without fullscreen');
      });
    }
  };

  const handleNextQuestion = async () => {
    if (currentAnswer.trim()) {
      await saveCurrentAnswer();
    }

    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer(answers[currentQuestionIndex + 1]?.answer || '');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1]?.answer || '');
    }
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;

    try {
      // Save current answer if any
      if (currentAnswer.trim()) {
        await saveCurrentAnswer();
      }

      // Complete the exam session
      await ExamService.completeExamSession(examSession.id);
      
      setIsSubmitted(true);
      
      // Stop anti-cheat monitoring
      if (antiCheatMonitor) {
        antiCheatMonitor.stopMonitoring();
      }

      // Call the completion callback
      onExamComplete();
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      addWarning('Error submitting exam. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / exam.questions.length) * 100;
  };

  if (isSubmitted) {
    return (
      <div className="exam-container">
        <div className="exam-completed">
          <h2>Exam Submitted Successfully</h2>
          <p>Thank you for completing the exam. Your responses have been recorded.</p>
          <p>You may now close this window.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-container">
      <div className="exam-header">
        <div className="exam-info">
          <h1>{exam.title}</h1>
          <p>{exam.description}</p>
        </div>
        
        <div className="exam-status">
          <div className="timer">
            <span className={timeLeft < 300 ? 'time-warning' : ''}>
              ⏰ {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="violation-counter">
            <span className={violationCount >= maxViolations - 1 ? 'violation-warning' : ''}>
              🚨 Violations: {violationCount}/{maxViolations}
            </span>
          </div>
          
          <div className="progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <span>{Object.keys(answers).length}/{exam.questions.length} answered</span>
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="warnings-panel">
          <h4>⚠️ Security Warnings:</h4>
          {warnings.slice(-3).map((warning, index) => (
            <div key={index} className="warning-item">
              {warning.message}
            </div>
          ))}
        </div>
      )}

      {!fullscreenRequested && (
        <div className="fullscreen-notice">
          <div className="notice-content">
            <h4>📺 Exam Security Notice</h4>
            <p>For exam security, this application will request fullscreen mode when you start typing. This helps prevent distractions and maintains exam integrity.</p>
            <button 
              onClick={() => {
                setFullscreenRequested(true);
                requestFullscreen().catch(() => {
                  console.log('Fullscreen request failed - continuing without fullscreen');
                });
              }}
              className="btn btn-info"
            >
              Enable Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      <div className="question-container">
        <div className="question-header">
          <h2>Question {currentQuestionIndex + 1} of {exam.questions.length}</h2>
        </div>

        <div className="question-content">
          <p>{exam.questions[currentQuestionIndex].question}</p>
        </div>

        <div className="answer-section">
          <label>Your Answer:</label>
          <textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here... (text only, no copy/paste allowed)"
            rows="10"
            disabled={isSubmitted}
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          />
          
          <div className="answer-info">
            <span>Characters: {currentAnswer.length}</span>
            <span>Words: {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0}</span>
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn btn-secondary"
          >
            Previous
          </button>

          <button
            onClick={saveCurrentAnswer}
            disabled={!currentAnswer.trim()}
            className="btn btn-info"
          >
            Save Answer
          </button>

          {currentQuestionIndex < exam.questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitExam}
              className="btn btn-success"
              disabled={Object.keys(answers).length === 0}
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>

      <div className="exam-sidebar">
        <h3>Question Overview</h3>
        <div className="question-list">
          {exam.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentQuestionIndex(index);
                setCurrentAnswer(answers[index]?.answer || '');
              }}
              className={`question-nav ${index === currentQuestionIndex ? 'current' : ''} ${answers[index] ? 'answered' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="exam-actions">
          <button
            onClick={handleSubmitExam}
            className="btn btn-warning"
            disabled={Object.keys(answers).length === 0}
          >
            Submit Exam Early
          </button>
        </div>
      </div>
    </div>
  );
};

export default Exam;
