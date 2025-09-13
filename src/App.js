import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import ProtectedAdmin from './ProtectedAdmin';
import Exam from './Exam';
import './App.css';

function App() {
  const [currentExam, setCurrentExam] = useState(null);
  const [currentExamSession, setCurrentExamSession] = useState(null);
  const [examCompleted, setExamCompleted] = useState(false);

  const handleStartExam = (exam, examSession) => {
    setCurrentExam(exam);
    setCurrentExamSession(examSession);
    setExamCompleted(false);
  };

  const handleExamComplete = () => {
    setExamCompleted(true);
  };

  const resetExam = () => {
    setCurrentExam(null);
    setCurrentExamSession(null);
    setExamCompleted(false);
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              currentExam && currentExamSession && !examCompleted ? (
                <Exam 
                  exam={currentExam}
                  examSession={currentExamSession}
                  onExamComplete={handleExamComplete}
                />
              ) : examCompleted ? (
                <div className="exam-completed-page">
                  <h2>Exam Completed</h2>
                  <p>Thank you for completing the exam. Your responses have been submitted successfully.</p>
                  <button onClick={resetExam} className="btn btn-primary">
                    Take Another Exam
                  </button>
                </div>
              ) : (
                <Home onStartExam={handleStartExam} />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={<ProtectedAdmin />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;