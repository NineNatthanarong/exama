import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

// Collections
export const COLLECTIONS = {
  EXAMS: 'exams',
  EXAM_SESSIONS: 'exam_sessions',
  RESPONSES: 'responses'
};

// Exam Service
export class ExamService {
  
  // Create a new exam
  static async createExam(examData) {
    try {
      const examRef = await addDoc(collection(db, COLLECTIONS.EXAMS), {
        ...examData,
        createdAt: serverTimestamp(),
        isActive: true
      });
      return examRef.id;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  }

  // Get exam by ID
  static async getExam(examId) {
    try {
      const examDoc = await getDoc(doc(db, COLLECTIONS.EXAMS, examId));
      if (examDoc.exists()) {
        return { id: examDoc.id, ...examDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting exam:', error);
      throw error;
    }
  }

  // Get all exams
  static async getAllExams() {
    try {
      const q = query(collection(db, COLLECTIONS.EXAMS), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting exams:', error);
      throw error;
    }
  }

  // Update exam
  static async updateExam(examId, updates) {
    try {
      await updateDoc(doc(db, COLLECTIONS.EXAMS, examId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  }

  // Generate unique exam session ID
  static generateSessionId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Create exam session
  static async createExamSession(examId, sessionId) {
    try {
      const sessionRef = await addDoc(collection(db, COLLECTIONS.EXAM_SESSIONS), {
        examId,
        sessionId,
        startTime: serverTimestamp(),
        isCompleted: false,
        isActive: true,
        isUsed: false, // Track if session has been accessed
        responses: {},
        antiCheatFlags: {
          tabSwitches: 0,
          copyAttempts: 0,
          pasteAttempts: 0,
          focusLost: 0,
          suspiciousKeystrokes: 0,
          devTools: 0
        }
      });
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating exam session:', error);
      throw error;
    }
  }

  // Get exam session by session ID
  static async getExamSession(sessionId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.EXAM_SESSIONS), 
        where('sessionId', '==', sessionId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const sessionData = sessionDoc.data();
        
        // Check if session is already used
        if (sessionData.isUsed) {
          throw new Error('This User Exam ID has already been used and cannot be used again.');
        }
        
        // Check if session is completed
        if (sessionData.isCompleted) {
          throw new Error('This exam session has already been completed.');
        }
        
        // Mark session as used
        await updateDoc(sessionDoc.ref, {
          isUsed: true,
          firstAccessTime: serverTimestamp()
        });
        
        return { id: sessionDoc.id, ...sessionData, isUsed: true };
      }
      return null;
    } catch (error) {
      console.error('Error getting exam session:', error);
      throw error;
    }
  }

  // Update exam session
  static async updateExamSession(sessionDocId, updates) {
    try {
      await updateDoc(doc(db, COLLECTIONS.EXAM_SESSIONS, sessionDocId), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating exam session:', error);
      throw error;
    }
  }

  // Save response
  static async saveResponse(sessionDocId, questionIndex, response, keystrokeData) {
    try {
      const sessionRef = doc(db, COLLECTIONS.EXAM_SESSIONS, sessionDocId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const currentResponses = sessionDoc.data().responses || {};
        currentResponses[questionIndex] = {
          answer: response,
          timestamp: serverTimestamp(),
          keystrokeData: keystrokeData
        };

        await updateDoc(sessionRef, {
          responses: currentResponses,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  }

  // Complete exam session
  static async completeExamSession(sessionDocId) {
    try {
      await updateDoc(doc(db, COLLECTIONS.EXAM_SESSIONS, sessionDocId), {
        isCompleted: true,
        completedAt: serverTimestamp(),
        isActive: false
      });
    } catch (error) {
      console.error('Error completing exam session:', error);
      throw error;
    }
  }

  // Get exam results
  static async getExamResults(examId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.EXAM_SESSIONS),
        where('examId', '==', examId),
        where('isCompleted', '==', true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting exam results:', error);
      throw error;
    }
  }

  // Record anti-cheat violation
  static async recordAntiCheatViolation(sessionDocId, violationType) {
    try {
      const sessionRef = doc(db, COLLECTIONS.EXAM_SESSIONS, sessionDocId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const currentFlags = sessionDoc.data().antiCheatFlags || {};
        currentFlags[violationType] = (currentFlags[violationType] || 0) + 1;

        await updateDoc(sessionRef, {
          antiCheatFlags: currentFlags,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error recording anti-cheat violation:', error);
      throw error;
    }
  }

  // Delete exam session (student response)
  static async deleteExamSession(sessionDocId) {
    try {
      const sessionRef = doc(db, COLLECTIONS.EXAM_SESSIONS, sessionDocId);
      await deleteDoc(sessionRef);
      console.log('Exam session deleted successfully');
    } catch (error) {
      console.error('Error deleting exam session:', error);
      throw error;
    }
  }
}