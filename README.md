# Simplified Examination System

A streamlined web-based examination system built with React and Firebase, featuring a single exam workflow with user-specific exam IDs and manual scoring.

## Setup Instructions

### Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project or create a new one
   - Go to Project Settings → General → Your apps
   - Copy the Firebase config values and update your `.env` file:

   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. **Install dependencies and start:**
   ```bash
   npm install
   npm start
   ```

⚠️ **Security Note:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

## Features

### For Administrators
- **Single Exam Management**: Create and manage one exam at a time
- **User Exam ID Generation**: Generate unique IDs for individual students
- **Results Viewing**: View all student responses for manual scoring
- **Firebase Authentication**: Secure admin access with email/password

### For Students
- **User Exam ID Access**: Enter unique user exam ID to access the exam
- **Text-only Responses**: All answers must be typed manually
- **Progress Tracking**: Real-time progress indicator and timer
- **Auto-save**: Responses automatically saved every 30 seconds

### Anti-Cheat Features
- **Copy/Paste Prevention**: Disabled throughout the exam
- **Tab Switch Detection**: Monitors and logs tab switching
- **Focus Monitoring**: Detects when user leaves the exam window
- **Keystroke Analysis**: Analyzes typing patterns for anomalies
- **AI Content Detection**: Flags potentially AI-generated responses
- **Developer Tools Prevention**: Blocks access to browser dev tools
- **Fullscreen Mode**: Encourages fullscreen exam taking

## System Workflow

1. **Admin creates exam** → System replaces any existing exam
2. **Admin generates user exam IDs** → Unique ID for each student
3. **Student enters user exam ID** → Authenticates and starts exam
4. **Student completes exam** → Responses saved with anti-cheat data
5. **Admin manually scores responses** → No automatic grading

## Key Changes from Standard Systems

- **No Expected Keywords**: Questions don't require expected answers - admin scores manually
- **Single Exam Only**: System supports one active exam at a time
- **User-Specific IDs**: Each student gets a unique user_exam_id instead of session-based access
- **Manual Scoring**: All responses require manual evaluation by admin

## Technology Stack

- **Frontend**: React 18 with React Router
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Authentication (admin only)
- **Styling**: Custom CSS with responsive design
- **Anti-cheat**: Custom JavaScript monitoring system

## Database Structure

### Collections

1. **exams**
   - `title`: Exam title
   - `description`: Exam description
   - `timeLimit`: Time limit in minutes
   - `questions`: Array of question objects
   - `isActive`: Boolean exam status
   - `createdAt`: Timestamp

2. **exam_sessions**
   - `examId`: Reference to exam
   - `sessionId`: Unique session identifier
   - `startTime`: Session start timestamp
   - `isCompleted`: Boolean completion status
   - `responses`: Object containing user responses
   - `antiCheatFlags`: Object tracking violations

3. **responses** (stored within exam_sessions)
   - `answer`: User's text response
   - `timestamp`: Response timestamp
   - `keystrokeData`: Typing pattern analysis
   - `aiAnalysis`: AI content detection results

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Get your Firebase configuration object
4. Update `src/firebase.js` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Firestore Security Rules

Set up Firestore security rules to allow read/write access:

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

**Note**: For production, implement proper security rules based on your requirements.

### 3. Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Usage Guide

### For Administrators

1. **Access Admin Panel**
   - Navigate to `/admin` in your browser
   - Sign in with your admin credentials (Firebase Authentication required)

2. **Create an Exam**
   - Click "Create New Exam" (or "Replace Current Exam" if one exists)
   - Fill in exam details (title, description, time limit)
   - Add questions (no keywords needed - manual scoring)
   - Submit to create the exam (replaces any existing exam)

3. **Generate User Exam IDs**
   - Click "Generate User Exam ID" for the current exam
   - Each click creates a unique ID for one student
   - Share each ID with the respective student

4. **View and Score Results**
   - Click "View Results" to see all completed exams
   - Review answers and manually assign scores
   - Check anti-cheat violation reports for each student

### For Students

1. **Access Exam**
   - Go to the main page
   - Enter the user exam ID provided by administrator
   - Click "Start Exam"

2. **Taking the Exam**
   - Read instructions carefully
   - Answer questions in the text areas (typing only)
   - Use navigation buttons to move between questions
   - Monitor your progress and remaining time

3. **Submission**
   - Click "Submit Exam" when finished
   - Exam auto-submits when time expires
   - Cannot retake once submitted (one-time use per ID)

## Anti-Cheat System Details

### Detection Methods

1. **Copy/Paste Prevention**
   - Disabled via event handlers
   - Attempts are logged and flagged

2. **Tab Switching Detection**
   - Uses `visibilitychange` event
   - Logs each occurrence with timestamp

3. **Focus Monitoring**
   - Detects window blur/focus events
   - Continuous monitoring every 5 seconds

4. **Keystroke Analysis**
   - Measures typing intervals
   - Flags suspiciously consistent patterns
   - Detects potential automated input

5. **AI Content Detection**
   - Analyzes text for AI-generated patterns
   - Checks for formal language structures
   - Flags responses for manual review

6. **Browser Restrictions**
   - Prevents developer tools access
   - Disables context menu (right-click)
   - Blocks common keyboard shortcuts

### Violation Reporting

All violations are stored in Firebase with:
- Violation type and count
- Timestamps
- Session context
- Keystroke analysis data

## Security Considerations

### For Production Use

1. **Authentication**
   - Implement admin authentication
   - Add role-based access control

2. **Firestore Security**
   - Create proper security rules
   - Implement user-based data access

3. **Session Management**
   - Add session expiration
   - Implement session cleanup

4. **Data Privacy**
   - Add data encryption
   - Implement GDPR compliance

5. **Network Security**
   - Use HTTPS only
   - Implement rate limiting

## File Structure

```
src/
├── App.js                 # Main application component
├── App.css               # Global styles
├── index.js              # Application entry point
├── firebase.js           # Firebase configuration
├── examService.js        # Firebase service functions
├── antiCheat.js          # Anti-cheat utilities
├── Home.jsx              # Main user interface
├── Home.css              # Home page styles
├── Admin.jsx             # Admin panel component
├── Admin.css             # Admin panel styles
├── Exam.jsx              # Exam taking interface
└── Exam.css              # Exam interface styles
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Known Limitations

1. **Mobile Devices**: Some anti-cheat features may not work on mobile browsers
2. **Screen Recording**: Cannot prevent external screen recording software
3. **Multiple Devices**: User could potentially use another device for assistance
4. **Network Dependency**: Requires stable internet connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the GitHub issues page
2. Create a new issue with detailed description
3. Include browser console errors if applicable

## Future Enhancements

- [ ] Multiple choice questions support
- [ ] File upload capabilities
- [ ] Advanced proctoring features
- [ ] Automated grading system
- [ ] Analytics dashboard
- [ ] Mobile app version
- [ ] Offline mode support