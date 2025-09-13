import React, { useState } from 'react';
import { ExamService } from './examService';
import './Home.css';

const Home = ({ onStartExam }) => {
  const [userExamId, setUserExamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userExamId.trim()) {
      setError('กรุณาใส่รหัสผู้เข้าสอบให้ถูกต้อง');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify user exam ID exists and is valid
      const examSession = await ExamService.getExamSession(userExamId.trim().toUpperCase());
      
      if (!examSession) {
        setError('รหัสผู้เข้าสอบไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
        setLoading(false);
        return;
      }

      if (examSession.isCompleted) {
        setError('การสอบนี้ได้ทำเสร็จสิ้นแล้ว');
        setLoading(false);
        return;
      }

      if (!examSession.isActive) {
        setError('การสอบนี้ไม่ได้เปิดใช้งานแล้ว');
        setLoading(false);
        return;
      }

      // Get the exam details
      const exam = await ExamService.getExam(examSession.examId);
      
      if (!exam) {
        setError('ไม่พบข้อมูลการสอบ กรุณาติดต่อผู้ดูแลระบบ');
        setLoading(false);
        return;
      }

      if (!exam.isActive) {
        setError('การสอบนี้ไม่ได้เปิดใช้งานแล้ว');
        setLoading(false);
        return;
      }

      // Start the exam
      onStartExam(exam, examSession);
      
    } catch (error) {
      console.error('Error verifying session:', error);
      if (error.message.includes('already been used')) {
        setError('รหัสผู้เข้าสอบนี้ถูกใช้งานแล้ว ไม่สามารถใช้ซ้ำได้');
      } else if (error.message.includes('already been completed')) {
        setError('การสอบนี้ได้ทำเสร็จสิ้นแล้ว');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="header">
          <div className="logo-section">
            <div className="exam-icon">📋</div>
            <h1>ระบบสอบออนไลน์</h1>
            <h2 className="subtitle">Online Examination System</h2>
          </div>
          <p className="welcome-text">กรุณาใส่รหัสผู้เข้าสอบเพื่อเริ่มทำการสอบ</p>
        </div>

        <form onSubmit={handleSubmit} className="session-form">
          <div className="form-group">
            <label htmlFor="userExamId">
              <span className="label-text">รหัสผู้เข้าสอบ (User Exam ID)</span>
              <span className="label-required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="userExamId"
                value={userExamId}
                onChange={(e) => setUserExamId(e.target.value.toUpperCase())}
                placeholder="ใส่รหัสผู้เข้าสอบ 9 หลัก"
                maxLength={9}
                disabled={loading}
                className={error ? 'error' : ''}
              />
              <div className="input-icon">🔑</div>
            </div>
            {error && <div className="error-message">⚠️ {error}</div>}
          </div>

          <button 
            type="submit" 
            disabled={loading || !userExamId.trim()}
            className="btn btn-primary submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                เริ่มทำการสอบ
              </>
            )}
          </button>
        </form>

        <div className="rules-section">
          <div className="rules-header">
            <h3>
              <span className="rules-icon">📖</span>
              กติกาและข้อปฏิบัติในการสอบ
            </h3>
          </div>
          
          <div className="rules-content">
            <div className="rule-category">
              <h4>📱 ข้อกำหนดทางเทคนิค</h4>
              <div className="rule-list">
                <div className="rule-item">
                  <span className="rule-icon">🌐</span>
                  <span>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตให้มั่นคง</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">🖥️</span>
                  <span>ใช้เบราว์เซอร์ Chrome, Firefox, หรือ Safari เวอร์ชันล่าสุด</span>
                </div>
                <div className="rule-item">
                  <span className="rule-icon">📱</span>
                  <span>แนะนำให้ใช้คอมพิวเตอร์หรือแท็บเล็ตขนาดใหญ่</span>
                </div>
              </div>
            </div>

            <div className="rule-category">
              <h4>🚫 ข้อห้ามระหว่างการสอบ</h4>
              <div className="rule-list">
                <div className="rule-item warning">
                  <span className="rule-icon">⚠️</span>
                  <span><strong>ห้าม</strong>ปิดหน้าต่างเบราว์เซอร์หรือแท็บนี้</span>
                </div>
                <div className="rule-item warning">
                  <span className="rule-icon">🔄</span>
                  <span><strong>ห้าม</strong>สลับไปแท็บหรือแอปพลิเคชันอื่น</span>
                </div>
                <div className="rule-item warning">
                  <span className="rule-icon">📋</span>
                  <span><strong>ห้าม</strong>คัดลอกและวางข้อความ (Copy-Paste)</span>
                </div>
                <div className="rule-item warning">
                  <span className="rule-icon">🔧</span>
                  <span><strong>ห้าม</strong>เปิด Developer Tools (F12)</span>
                </div>
              </div>
            </div>

            <div className="rule-category">
              <h4>✅ วิธีการทำการสอบ</h4>
              <div className="rule-list">
                <div className="rule-item success">
                  <span className="rule-icon">✍️</span>
                  <span>พิมพ์คำตอบด้วยตนเองเท่านั้น</span>
                </div>
                <div className="rule-item success">
                  <span className="rule-icon">💾</span>
                  <span>ระบบจะบันทึกคำตอบอัตโนมัติทุก 30 วินาที</span>
                </div>
                <div className="rule-item success">
                  <span className="rule-icon">⏰</span>
                  <span>ระบบจะส่งข้อสอบอัตโนมัติเมื่อหมดเวลา</span>
                </div>
                <div className="rule-item success">
                  <span className="rule-icon">🔒</span>
                  <span>รหัสผู้เข้าสอบใช้ได้เพียงครั้งเดียวเท่านั้น</span>
                </div>
              </div>
            </div>

            <div className="violation-warning">
              <div className="warning-header">
                <span className="warning-icon">🚨</span>
                <h4>คำเตือนสำคัญ</h4>
              </div>
              <p>
                หากมีการฝ่าฝืนกฎข้างต้น ระบบจะนับเป็นการกระทำผิด<br/>
                <strong>เมื่อกระทำผิดครบ 3 ครั้ง ระบบจะส่งข้อสอบอัตโนมัติทันที</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="help-section">
          <div className="help-item">
            <span className="help-icon">🆘</span>
            <span>หากพบปัญหาทางเทคนิค กรุณาติดต่อผู้ดูแลระบบ</span>
          </div>
        </div>

        <div className="admin-link">
          <p>
            <span className="admin-text">สำหรับผู้ดูแลระบบ</span>
            <a href="/admin" className="admin-btn">
              <span className="admin-icon">⚙️</span>
              เข้าสู่ระบบจัดการ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;