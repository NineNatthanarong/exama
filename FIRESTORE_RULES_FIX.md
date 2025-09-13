# Firebase Security Rules Fix

## Problem
You're getting a "Missing or insufficient permissions" error when trying to create exam sessions. This is because the default Firestore security rules are blocking write operations.

## Solution
You need to update your Firestore security rules to allow the examination system to function properly.

### Step 1: Access Firestore Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ai-test-fe978`
3. Navigate to **Firestore Database** from the left sidebar
4. Click on the **Rules** tab

### Step 2: Update Security Rules

Replace the current rules with the following configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Exams collection - only authenticated users (admins) can read/write
    match /exams/{examId} {
      allow read, write: if request.auth != null;
    }
    
    // Exam sessions - allow public read/write for students to access exams
    // In production, you may want to implement more specific rules
    match /exam_sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // Alternative more secure rules (uncomment if you want stricter security):
    // match /exam_sessions/{sessionId} {
    //   // Allow authenticated users (admins) full access
    //   allow read, write: if request.auth != null;
    //   // Allow unauthenticated users to read and update existing sessions
    //   allow read, update: if true;
    //   // Prevent unauthenticated users from creating new sessions
    //   allow create: if false;
    // }
  }
}
```

### Step 3: For Development/Testing (Temporary)

If you want to quickly test without restrictions, you can temporarily use these open rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning: Do NOT use open rules in production!**

### Step 4: Apply the Rules

1. Copy the rules code above
2. Paste it into the Firebase Console Rules editor
3. Click **Publish** to apply the changes
4. Wait a few moments for the rules to propagate

### Step 5: Test the Application

1. Go back to your application
2. Try generating a user exam ID again
3. The error should be resolved

## Recommended Production Rules

For production use, implement these more secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Exams - only authenticated admins
    match /exams/{examId} {
      allow read, write: if request.auth != null;
    }
    
    // Exam sessions - controlled access
    match /exam_sessions/{sessionId} {
      // Admins can do everything
      allow read, write: if request.auth != null;
      
      // Students can read their own session and update responses
      allow read: if resource.data.sessionId == request.query.sessionId;
      allow update: if resource.data.sessionId == request.query.sessionId 
                    && !('isCompleted' in request.resource.data) 
                    && resource.data.isCompleted == false;
    }
  }
}
```

## Why This Happened

1. **Default Security**: Firebase Firestore starts with restrictive security rules
2. **Authentication Context**: The exam session creation happens in an admin context, but students also need to access sessions
3. **Mixed Access Patterns**: Your app has both authenticated (admin) and unauthenticated (student) users

## Quick Fix Steps

1. ✅ Go to Firebase Console → Firestore → Rules
2. ✅ Use the development rules above (temporarily)
3. ✅ Click Publish
4. ✅ Test your application
5. ✅ Implement proper production rules later

After applying these rules, your application should work correctly without permission errors.