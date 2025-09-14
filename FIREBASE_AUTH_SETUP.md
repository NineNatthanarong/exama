# Firebase Authentication Setup Guide

## Steps to Enable Firebase Authentication

### 1. Enable Authentication in Firebase Console

1. Go to your Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Authentication** from the left sidebar
3. Click on **Get started** if you haven't enabled Authentication yet
4. Go to the **Sign-in method** tab
5. Enable **Email/Password** authentication:
   - Click on **Email/Password**
   - Toggle **Enable** to ON
   - Click **Save**

### 2. Create Admin Users

You have two options to create the first admin user:

#### Option A: Using the Web Application (Recommended)
1. Go to `http://localhost:3000/admin`
2. Enter the desired email and password for the first admin account
3. Click "Sign In"
4. The system will automatically create the first admin account if no users exist

#### Option B: Using Firebase Console
1. In Firebase Console, go to **Authentication** > **Users**
2. Click **Add user**
3. Enter email and password for the admin
4. Click **Add user**

**Note:** After the first admin account is created, new accounts can only be created through the Firebase Console or Admin SDK. The web application will only allow sign-in for existing accounts.

### 3. Test the Authentication

1. Navigate to `http://localhost:3000/admin`
2. You should see the login form
3. Enter the admin credentials you created
4. You should be redirected to the admin panel

### 4. Security Rules (Optional but Recommended)

For production use, update your Firestore security rules to only allow authenticated users to manage exams:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write exam data
    match /exams/{examId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow anyone to read/write exam sessions (students need access)
    match /exam_sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // Alternatively, implement more granular rules based on your needs
  }
}
```

## How It Works

### Authentication Flow

1. **Admin Access**: When visiting `/admin`, the user is prompted to log in
2. **First Admin Creation**: If no admin accounts exist, the system automatically creates the first admin account during the initial login attempt
3. **Login Process**: Users authenticate with email/password
4. **Session Management**: Firebase handles session persistence
5. **Logout**: Admins can logout using the logout button
6. **Protection**: Only authenticated users can access admin features

### User Roles

- **All authenticated users** are considered admins
- **Unauthenticated users** can only access the exam-taking interface
- **Students** do not need authentication (they use session IDs)

### Security Features

- **Automatic first admin setup**: Automatically creates the first admin account when no users exist
- **Controlled account creation**: After the first admin is created, new accounts can only be created through Firebase Console
- **Session persistence**: Users stay logged in across browser sessions
- **Automatic logout**: Logout functionality included
- **Protected routes**: Admin panel requires authentication
- **Error handling**: User-friendly error messages for login issues

## Troubleshooting

### Common Issues

1. **"No admin account found"**
   - Make sure you've created a user in Firebase Authentication
   - Verify the email address is correct

2. **"Authentication error"**
   - Check your internet connection
   - Verify Firebase configuration in `src/firebase.js`

3. **"This admin account has been disabled"**
   - Check the user status in Firebase Console > Authentication > Users

4. **Cannot access admin panel**
   - Make sure you're logged in
   - Clear browser cache and cookies
   - Check browser console for errors

### Checking Authentication Status

You can verify authentication in the browser console:
```javascript
// Check if user is logged in
import { AuthService } from './src/authService.js';
console.log(AuthService.getCurrentUser());
```

## Production Considerations

1. **Enable reCAPTCHA** in Firebase Console for additional security
2. **Set up password requirements** in Authentication settings
3. **Monitor authentication metrics** in Firebase Console
4. **Implement proper error logging** for production debugging
5. **Consider multi-factor authentication** for enhanced security

## Next Steps

- Set up admin user accounts
- Test the complete authentication flow
- Customize login forms if needed
- Configure production security rules