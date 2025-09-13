import React, { useState, useEffect } from 'react';
import { ExamService } from './examService';
import { AuthService } from './authService';
import './Admin.css';

const Admin = () => {
  const [currentExam, setCurrentExam] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    timeLimit: 60, // in minutes
    questions: [{ question: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [examResults, setExamResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentExam();
    // Get current user info
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const loadCurrentExam = async () => {
    try {
      const examList = await ExamService.getAllExams();
      // Get the most recent active exam
      const activeExam = examList.find(exam => exam.isActive);
      setCurrentExam(activeExam || null);
    } catch (error) {
      console.error('Error loading exam:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExamForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...examForm.questions];
    updatedQuestions[index][field] = value;
    setExamForm(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const addQuestion = () => {
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '' }]
    }));
  };

  const removeQuestion = (index) => {
    if (examForm.questions.length > 1) {
      const updatedQuestions = examForm.questions.filter((_, i) => i !== index);
      setExamForm(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
    }
  };

  const handleKeywordsChange = (questionIndex, keywords) => {
    // Remove this function as keywords are no longer needed
  };

  const createExam = async (e) => {
    e.preventDefault();
    
    // Confirm replacement if there's an existing exam
    if (currentExam) {
      const confirmReplace = window.confirm(
        `Are you sure you want to replace the current exam "${currentExam.title}"? This will deactivate the current exam and all existing user exam IDs will no longer work.`
      );
      if (!confirmReplace) {
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Deactivate current exam if exists
      if (currentExam) {
        await ExamService.updateExam(currentExam.id, { isActive: false });
      }

      const examId = await ExamService.createExam(examForm);
      console.log('Exam created with ID:', examId);
      
      // Reset form
      setExamForm({
        title: '',
        description: '',
        timeLimit: 60,
        questions: [{ question: '' }]
      });
      setShowCreateForm(false);
      loadCurrentExam();
      
      // Show success message
      alert(currentExam ? 'Exam replaced successfully!' : 'Exam created successfully!');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Error creating exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateUserExamId = async (examId) => {
    try {
      const userExamId = ExamService.generateSessionId();
      const sessionDocId = await ExamService.createExamSession(examId, userExamId);
      
      alert(`User Exam ID Generated!\nUser Exam ID: ${userExamId}\nPlease give this ID to the student.`);
    } catch (error) {
      console.error('Error generating user exam ID:', error);
      alert('Error generating user exam ID. Please try again.');
    }
  };

  const viewExamResults = async () => {
    if (!currentExam) return;
    
    try {
      const results = await ExamService.getExamResults(currentExam.id);
      setExamResults(results);
    } catch (error) {
      console.error('Error loading exam results:', error);
      alert('Error loading exam results. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      console.log('Admin logged out');
      // The App component will handle the redirect
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  };

  const formatAntiCheatFlags = (flags) => {
    if (!flags) return 'No violations';
    
    const violations = [];
    if (flags.tabSwitches > 0) violations.push(`Tab switches: ${flags.tabSwitches}`);
    if (flags.copyAttempts > 0) violations.push(`Copy attempts: ${flags.copyAttempts}`);
    if (flags.pasteAttempts > 0) violations.push(`Paste attempts: ${flags.pasteAttempts}`);
    if (flags.focusLost > 0) violations.push(`Focus lost: ${flags.focusLost}`);
    if (flags.suspiciousKeystrokes > 0) violations.push(`Suspicious keystrokes: ${flags.suspiciousKeystrokes}`);
    if (flags.devTools > 0) violations.push(`Developer tools: ${flags.devTools}`);
    
    return violations.length > 0 ? violations.join(', ') : 'No violations';
  };

  const deleteStudentResponse = async (sessionDocId, sessionId) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the response from User Exam ID: ${sessionId}?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      await ExamService.deleteExamSession(sessionDocId);
      alert('Student response deleted successfully.');
      // Refresh the results
      await viewExamResults();
    } catch (error) {
      console.error('Error deleting student response:', error);
      alert('Error deleting student response. Please try again.');
    }
  };

  const clearAllResponses = async () => {
    if (examResults.length === 0) {
      alert('No responses to clear.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ALL ${examResults.length} student responses?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      // Delete all responses
      const deletePromises = examResults.map(result => 
        ExamService.deleteExamSession(result.id)
      );
      
      await Promise.all(deletePromises);
      alert(`Successfully deleted all ${examResults.length} student responses.`);
      
      // Clear the results from state
      setExamResults([]);
    } catch (error) {
      console.error('Error clearing all responses:', error);
      alert('Error clearing responses. Some responses may not have been deleted.');
      // Refresh results to show current state
      await viewExamResults();
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Exam Administration Panel</h1>
        <div className="admin-user-info">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn btn-secondary logout-btn">
            Logout
          </button>
        </div>
      </div>
      
      <div className="admin-actions">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel' : currentExam ? 'Replace Current Exam' : 'Create New Exam'}
        </button>
        
        {currentExam && !showCreateForm && (
          <>
            <button 
              onClick={() => generateUserExamId(currentExam.id)}
              className="btn btn-success"
            >
              Generate User Exam ID
            </button>
            <button 
              onClick={viewExamResults}
              className="btn btn-info"
            >
              View Results
            </button>
            {examResults.length > 0 && (
              <button 
                onClick={clearAllResponses}
                className="btn btn-danger"
              >
                Clear All Responses ({examResults.length})
              </button>
            )}
          </>
        )}
      </div>

      {showCreateForm && (
        <div className="create-exam-form">
          <h2>{currentExam ? 'Replace Current Exam' : 'Create New Exam'}</h2>
          <form onSubmit={createExam}>
            <div className="form-group">
              <label>Exam Title:</label>
              <input
                type="text"
                name="title"
                value={examForm.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={examForm.description}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Time Limit (minutes):</label>
              <input
                type="number"
                name="timeLimit"
                value={examForm.timeLimit}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="questions-section">
              <h3>Questions</h3>
              {examForm.questions.map((question, index) => (
                <div key={index} className="question-form">
                  <div className="question-header">
                    <h4>Question {index + 1}</h4>
                    {examForm.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="btn btn-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Question Text:</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      rows="3"
                      required
                    />
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-secondary"
              >
                Add Question
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (currentExam ? 'Replacing...' : 'Creating...') : (currentExam ? 'Replace Exam' : 'Create Exam')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="current-exam">
        <h2>Current Exam</h2>
        {currentExam ? (
          <div className="exam-card">
            <h3>{currentExam.title}</h3>
            <p>{currentExam.description}</p>
            <p><strong>Questions:</strong> {currentExam.questions.length}</p>
            <p><strong>Time Limit:</strong> {currentExam.timeLimit} minutes</p>
            <p><strong>Status:</strong> {currentExam.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        ) : (
          <div className="no-exam">
            <p>No exam created yet. Create an exam to start generating user exam IDs.</p>
          </div>
        )}
      </div>

      {examResults.length > 0 && (
        <div className="exam-results">
          <h2>Exam Results</h2>
          <div className="results-list">
            {examResults.map((result, index) => (
              <div key={result.id} className="result-card">
                <div className="result-header">
                  <h4>User {index + 1} (User Exam ID: {result.sessionId})</h4>
                  <button 
                    onClick={() => deleteStudentResponse(result.id, result.sessionId)}
                    className="btn btn-danger delete-response-btn"
                    title="Delete this student response"
                  >
                    🗑️ Delete
                  </button>
                </div>
                <p><strong>Started:</strong> {result.startTime?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                <p><strong>Completed:</strong> {result.completedAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                <p><strong>Responses:</strong> {Object.keys(result.responses || {}).length}</p>
                <p><strong>Anti-cheat Flags:</strong> {formatAntiCheatFlags(result.antiCheatFlags)}</p>
                
                <div className="responses">
                  <h5>Answers (Manual Scoring Required):</h5>
                  {Object.entries(result.responses || {}).map(([questionIndex, response]) => (
                    <div key={questionIndex} className="response">
                      <strong>Q{parseInt(questionIndex) + 1}:</strong> {response.answer}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
