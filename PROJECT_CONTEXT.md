# PROJECT CONTEXT: Pomodoro Focus & App Restrictor (React Native MVP)

## 1. Project Overview & Tech Stack

- Target Platform: Cross-Platform (iOS & Android - Portrait Mode)
- Framework: React Native (Expo / React Native CLI)
- Language: TypeScript
- Navigation: React Navigation (Stack Navigator)
- State Management: Zustand / Redux Toolkit / React Context
- Storage: React Native Async Storage / MMKV
- Design Theme: Modern Minimalist
  - Background: System Adaptive (#F2F2F7 in Light)
  - Primary Accent: Deep Orange/Coral (#FF6B4A)
  - Container/Card Background: White (#FFFFFF) with 16pt border radius

---

## 2. Architecture & Data Models

### Navigation Flow

App state navigation managed via React Navigation Stack:
`GoalInput` ➔ `AppBlockerSetup` ➔ `TimerSetup` ➔ `FocusTimer` ➔ `Quiz` ➔ `SessionSummary`

### Core Data Models (TypeScript Interfaces)

```typescript
export interface StudySession {
  id: string;
  goalText: string;
  topicId: string;
  targetDurationSeconds: number;
  actualDurationSeconds: number;
  distractionAttempts: number;
  quizScore: number;
  totalQuizQuestions: number;
  isCompleted: boolean;
  timestamp: string; // ISO String
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
```

## 3. System Logic Flowchart (System Engine)

The core logic handles the focus lifecycle and app restriction states:

1. Setup Sequence:
   - User inputs study topic/goal & attaches documents[cite: 4, 5].
   - Selects focus duration[cite: 4, 5].
   - Selects restricted app list/categories via App Blocker settings/Native Module[cite: 4, 5].
2. Focus Mode (`Start timer`):
   - Activates App Restriction Shield / Overlay Service[cite: 4, 5].
   - Starts countdown timer[cite: 4, 5].
3. Distraction / Interruption Loop:
   - If User attempts to open a restricted app (`TRUE`)[cite: 4]:
     - System triggers shield/warning banner (`Send warning`)[cite: 4].
     - Increments attempt counter (`Count the attempt + 1`)[cite: 4].
     - Returns to loop (`Continue`)[cite: 4].
   - If User decides to give up early (`User give up = TRUE`)[cite: 4]:
     - Triggers `End timer` ➔ `End Restriction` (deactivates App Blocker) ➔ Transitions to `Save to Database` as incomplete session[cite: 4].
   - If User continues focus normally (`FALSE`)[cite: 4]:
     - Timer reaches 00:00:00 (`Timer end`)[cite: 4].
4. Completion & Assessment:
   - Upon `Timer end`, system executes `Restriction end` (Unlocks restricted apps)[cite: 4].
   - Automatically navigates to `Start quiz`[cite: 4, 5].
   - Fetches questions from `QuizBank.json` matching `topicId`[cite: 4, 5].
   - Evaluates session: Calculates quiz score, total focus time, and distraction attempt count[cite: 4, 5].
   - Persists session summary to Local Storage (`Save to Database`)[cite: 4] and renders `SessionSummaryView`[cite: 5].

---

## 4. Detailed UI Pages Specifications

### Page 1: Goal Input (`GoalInputScreen`)

- Header: Title "Set Your Goal" (Bold, 28pt), Indicator "Step 1 of 3"[cite: 5].
- Components:
  - Multi-line TextInput ("What are you studying today?")[cite: 5].
  - Study Materials 2x2 Grid block (Empty state with (+), populated state shows thumbnail & remove button)[cite: 5].
- Action: "NEXT" button (Enabled when Goal Text is filled)[cite: 5].

### Page 2: Distraction App Blocker (`AppBlockerSetupScreen`)

- Header: Title "Block Distractions", Subtitle, Indicator "Step 2 of 3"[cite: 5].
- Components:
  - Selected Apps Summary Card (shows count & default icons: Facebook, Instagram, TikTok)[cite: 5].
  - "Select Apps to Block" button triggering native app picker / list[cite: 5].
  - Quick Presets toggles ("Social Media", "Games", "Streaming")[cite: 5].
- Action: "NEXT" button (Saves app selection & advances to Page 3)[cite: 5].

### Page 3: Timer Setup (`TimerSetupScreen`)

- Header: Title "Focus Duration", Subtitle summary badge, Indicator "Step 3 of 3"[cite: 5].
- Components:
  - Quick Select Chips ("15m", "25m", "45m", "60m")[cite: 5].
  - Time Picker / Wheel Picker (Hours | Minutes | Seconds, default: 00:25:00)[cite: 5].
- Action: "START FOCUS" button (Activates Restriction Shield & starts Focus Mode)[cite: 4, 5].

### Page 4: Active Pomodoro Timer (`FocusTimerScreen`)

- State: App Restriction Shield ACTIVE[cite: 4, 5]. Header back action disabled[cite: 5].
- Components:
  - Header showing current Topic[cite: 5].
  - Circular progress ring (`react-native-svg`) + Countdown clock (`MM:SS`) + "Shield Active 🔒" badge[cite: 5].
  - Motivational tip card[cite: 5].
  - Emergency Action: "Give Up / End Early" button (Triggers confirmation Alert)[cite: 5].
- Transitions:
  - Countdown finish ➔ Haptic/sound ➔ Unlocks Shield (`Restriction end`) ➔ Navigates to `QuizScreen`[cite: 4, 5].

### Page 5: Multiple Choice Quiz (`QuizScreen`)

- Navigation: Topic Title + Question Progress Bar (e.g., "Question 2 of 3"). No back/skip button[cite: 5].
- Components:
  - Question Card with clear text[cite: 5].
  - 4 Answer Option Buttons (Default ➔ Correct: Green ✓, Incorrect: Red X)[cite: 5].
  - Explanation card appearing post-selection[cite: 5].
- Action: "Next Question" / "View Summary" button[cite: 5].

### Page 6: Session Summary (`SessionSummaryScreen`)

- Components:
  - Celebration Badge & "Session Complete!" title[cite: 5].
  - Score Card (e.g., "3 / 3 Correct") with feedback text[cite: 5].
  - Stats Grid: Focus Duration, Topic Studied, Distraction Count, Apps Blocked[cite: 4, 5].
- Action: "FINISH & SAVE" button (Saves session to AsyncStorage/MMKV & returns to Setup Page 1)[cite: 4, 5].

---

## 5. Coding Rules for AI Assistant (OpenCode)

1. Use TypeScript for all components and utilities with strict typing.
2. Maintain clean Component structure (Separation of UI Components, Custom Hooks for logic).
3. Do NOT truncate or abbreviate code blocks (Never use `// ... rest of code`).
4. Integrate `expo-haptics` or `react-native-haptic-feedback` for timer completion and quiz interaction.



## 6. Backend & API Specifications (Draft for Backend Dev)

### Architecture Overview

- RESTful API / GraphQL service to support mobile frontend.
- Authentication: JWT / OAuth2 (Google/Apple Sign-In).

### Core Database Entities (Schema)

1. **User Table**: `id`, `email`, `name`, `created_at`
2. **StudySession Table**:
   - `id`: UUID
   - `user_id`: UUID (Foreign Key)
   - `goal_text`: String
   - `topic_id`: String
   - `target_duration_seconds`: Integer
   - `actual_duration_seconds`: Integer
   - `distraction_attempts`: Integer
   - `quiz_score`: Integer
   - `total_quiz_questions`: Integer
   - `is_completed`: Boolean
   - `created_at`: Timestamp
3. **QuizBank Table**:
   - `id`: UUID
   - `topic_id`: String
   - `question`: Text
   - `options`: Array[String] (4 options)
   - `correct_index`: Integer
   - `explanation`: Text

### Primary API Endpoints Required

- `POST /api/v1/sessions` - Save completed/given-up study session summary
- `GET /api/v1/sessions/stats` - Fetch user historical statistics (total focus time, average quiz score)
- `GET /api/v1/quizzes?topicId={topicId}` - Retrieve quiz questions based on study topic
- `POST /api/v1/quizzes/generate` - (Optional AI Feature) Generate dynamic quiz questions from user uploaded text/documents
