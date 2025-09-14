import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

export class AuthService {
  
  // Check if first admin has been created
  static async hasFirstAdmin() {
    try {
      const adminStatusRef = doc(db, 'system', 'adminStatus');
      const adminStatusDoc = await getDoc(adminStatusRef);
      return adminStatusDoc.exists() && adminStatusDoc.data().firstAdminCreated === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return true; // Default to true to prevent accidental account creation
    }
  }

  // Mark first admin as created
  static async markFirstAdminCreated() {
    try {
      const adminStatusRef = doc(db, 'system', 'adminStatus');
      await setDoc(adminStatusRef, { 
        firstAdminCreated: true,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking first admin as created:', error);
    }
  }

  // Sign in with email and password - with automatic first admin creation
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      
      // If user not found and no first admin exists, create the first admin account
      if (error.code === 'auth/user-not-found') {
        const hasFirstAdmin = await this.hasFirstAdmin();
        if (!hasFirstAdmin) {
          try {
            console.log('Creating first admin account...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await this.markFirstAdminCreated();
            console.log('First admin account created successfully');
            return userCredential.user;
          } catch (createError) {
            console.error('Error creating first admin:', createError);
            throw createError;
          }
        }
      }
      
      throw error;
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Check if user is admin (all authenticated users are admins in this system)
  static isAdmin(user) {
    return user !== null;
  }

  // Get user email
  static getUserEmail() {
    const user = this.getCurrentUser();
    return user ? user.email : null;
  }

  // Get user ID
  static getUserId() {
    const user = this.getCurrentUser();
    return user ? user.uid : null;
  }
}

// Error message mapping for better user experience
export const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No admin account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This admin account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'An admin account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    default:
      return 'Authentication error. Please try again.';
  }
};