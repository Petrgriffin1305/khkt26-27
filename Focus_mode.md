# Focus Mode — System Logic Flowchart

> **Project:** Pomodoro Focus & App Restrictor (React Native MVP)
> **Scope:** Complete focus lifecycle — from setup to session persistence
> **Last Updated:** 2026-10-01

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Flowchart](#2-high-level-flowchart)
3. [State Machine — Focus Mode Lifecycle](#3-state-machine--focus-mode-lifecycle)
4. [Phase 1: Setup Sequence](#4-phase-1-setup-sequence)
5. [Phase 2: Focus Timer & Distraction Loop](#5-phase-2-focus-timer--distraction-loop)
6. [Phase 3: Quiz Assessment](#6-phase-3-quiz-assessment)
7. [Phase 4: Session Summary & Persistence](#7-phase-4-session-summary--persistence)
8. [Complete State Transition Table](#8-complete-state-transition-table)
9. [Data Flow Diagram](#9-data-flow-diagram)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)

---

## 1. System Overview

Focus Mode is the core engine of the app. It orchestrates four sequential phases:

| Phase | Screen(s) | Key Responsibility |
|-------|-----------|-------------------|
| **Setup** | GoalInput → AppBlockerSetup → TimerSetup | Collect goal, blocked apps, duration |
| **Focus** | FocusTimer | Run countdown, enforce app restriction, track distractions |
| **Assessment** | Quiz | Present topic quiz, calculate score |
| **Summary** | SessionSummary | Display stats, persist session, reset flow |

The system is governed by a **finite state machine** with two terminal outcomes:
- **Completed** — timer reached 00:00:00, quiz taken, session saved as `isCompleted: true`
- **Abandoned** — user gave up early, session saved as `isCompleted: false`

---

## 2. High-Level Flowchart

```mermaid
flowchart TD
    A([App Launch]) --> B[GoalInputScreen]
    B --> C{Goal text filled?}
    C -- No --> B
    C -- Yes --> D[AppBlockerSetupScreen]
    D --> E{Apps selected?}
    E -- No --> D
    E -- Yes --> F[TimerSetupScreen]
    F --> G{Duration set?}
    G -- No --> F
    G -- Yes --> H[FocusTimerScreen]

    H --> I[Activate Restriction Shield]
    I --> J[Start Countdown Timer]
    J --> K{Timer = 00:00:00?}

    K -- No --> L{Distraction attempt?}
    L -- Yes --> M[Trigger Warning Banner]
    M --> N[Increment Attempt Counter]
    N --> J
    L -- No --> O{User gives up?}
    O -- Yes --> P[End Timer]
    P --> Q[Deactivate Restriction Shield]
    Q --> R[Save Incomplete Session]
    R --> S([End — Abandoned])
    O -- No --> K

    K -- Yes --> T[Deactivate Restriction Shield]
    T --> U[Haptic + Sound Feedback]
    U --> V[QuizScreen]
    V --> W[Fetch Questions by topicId]
    W --> X[Present Question 1..N]
    X --> Y[Evaluate All Answers]
    Y --> Z[Calculate Score + Stats]
    Z --> AA[SessionSummaryScreen]
    AA --> AB[Save Completed Session]
    AB --> AC([End — Completed])
```

---

## 3. State Machine — Focus Mode Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> GoalInput : App Launch
    GoalInput --> AppBlockerSetup : Goal confirmed
    AppBlockerSetup --> TimerSetup : Apps selected
    TimerSetup --> FocusActive : START FOCUS pressed

    state FocusActive {
        [*] --> ShieldOn
        ShieldOn --> CountdownRunning : Timer started
        CountdownRunning --> DistractionDetected : Restricted app opened
        DistractionDetected --> CountdownRunning : Warning sent, counter++
        CountdownRunning --> TimerComplete : 00:00:00 reached
        CountdownRunning --> UserGiveUp : Give Up confirmed
    }

    FocusActive --> QuizAssessment : Timer complete (isCompleted=true)
    FocusActive --> SessionSave : User gives up (isCompleted=false)

    QuizAssessment --> SessionSave : All questions answered
    SessionSave --> SummaryDisplay : Persisted to storage
    SummaryDisplay --> Idle : FINISH & SAVE

    note right of FocusActive
        Shield ACTIVE throughout.
        Back navigation disabled.
        Give Up requires confirmation.
    end note

    note right of QuizAssessment
        No back/skip allowed.
        Explanation shown per question.
    end note
```

---

## 4. Phase 1: Setup Sequence

### 4.1 Setup Flowchart

```mermaid
flowchart LR
    subgraph Phase1[Phase 1 — Setup Sequence]
        direction TB
        A[GoalInputScreen] -->|NEXT| B[AppBlockerSetupScreen]
        B -->|NEXT| C[TimerSetupScreen]
        C -->|START FOCUS| D[FocusTimerScreen]
    end

    subgraph GoalInput[GoalInputScreen Details]
        G1[User enters goal text] --> G2[User attaches documents]
        G2 --> G3{Goal text non-empty?}
        G3 -- Yes --> G4[NEXT button enabled]
        G3 -- No --> G5[NEXT button disabled]
    end

    subgraph AppBlocker[AppBlockerSetupScreen Details]
        AB1[Display selected apps card] --> AB2[User picks apps / presets]
        AB2 --> AB3{At least 1 app selected?}
        AB3 -- Yes --> AB4[NEXT button enabled]
        AB3 -- No --> AB5[NEXT button disabled]
    end

    subgraph TimerSetup[TimerSetupScreen Details]
        T1[Quick chips: 15m / 25m / 45m / 60m] --> T2[Wheel picker: HH MM SS]
        T2 --> T3{Duration > 0?}
        T3 -- Yes --> T4[START FOCUS enabled]
        T3 -- No --> T5[START FOCUS disabled]
    end
```

### 4.2 Setup Data Collected

| Field | Source | Type | Required |
|-------|--------|------|----------|
| `goalText` | GoalInputScreen | `string` | Yes |
| `topicId` | Derived from goal / document | `string` | Yes |
| `attachedDocuments` | GoalInputScreen | `Document[]` | No |
| `blockedApps` | AppBlockerSetupScreen | `AppInfo[]` | Yes |
| `targetDurationSeconds` | TimerSetupScreen | `number` | Yes |

---

## 5. Phase 2: Focus Timer & Distraction Loop

### 5.1 Focus Timer Flowchart

```mermaid
flowchart TD
    START([START FOCUS pressed]) --> S1[Initialize FocusTimerScreen]
    S1 --> S2[Activate App Restriction Shield]
    S2 --> S3[Start Countdown Timer]
    S3 --> S4[Render Circular Progress Ring]
    S3 --> S5[Render MM:SS Countdown]
    S3 --> S6[Display Shield Active Badge]

    S3 --> LOOP{Tick — every 1 second}

    LOOP --> D1{User opened restricted app?}
    D1 -- TRUE --> D2[Trigger Warning Banner Overlay]
    D2 --> D3[Increment distractionAttempts]
    D3 --> D4[Haptic feedback — warning]
    D4 --> LOOP

    D1 -- FALSE --> G1{User tapped Give Up?}
    G1 -- TRUE --> G2[Show Confirmation Alert]
    G2 --> G3{User confirms give up?}
    G3 -- Yes --> G4[End Timer]
    G4 --> G5[Deactivate Restriction Shield]
    G5 --> G6[Set isCompleted = false]
    G6 --> G7[Save Incomplete Session]
    G7 --> END1([Transition to SessionSummary])

    G3 -- No --> LOOP
    G1 -- FALSE --> T1{Timer reached 00:00:00?}
    T1 -- NO --> LOOP
    T1 -- YES --> T2[Stop Timer]
    T2 --> T3[Deactivate Restriction Shield]
    T3 --> T4[Haptic feedback — success]
    T4 --> T5[Play completion sound]
    T5 --> T6[Set isCompleted = true]
    T6 --> END2([Auto-navigate to QuizScreen])
```

### 5.2 Distraction Detection Sub-Flow

```mermaid
flowchart LR
    A[Native Module: App State Listener] --> B{Foreground app changed?}
    B -- No --> A
    B -- Yes --> C{New app in blocked list?}
    C -- No --> A
    C -- Yes --> D[Intercept app launch]
    D --> E[Show Shield Overlay / Warning Banner]
    E --> F[Log distraction attempt]
    F --> G[distractionAttempts += 1]
    G --> H[Return to FocusTimerScreen]
```

### 5.3 Focus Timer State Variables

| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `remainingSeconds` | `number` | `targetDurationSeconds` | Countdown value |
| `distractionAttempts` | `number` | `0` | Count of blocked app open attempts |
| `isShieldActive` | `boolean` | `true` | Restriction shield state |
| `isTimerRunning` | `boolean` | `true` | Timer tick state |
| `isCompleted` | `boolean` | `false` | Session completion flag |
| `actualDurationSeconds` | `number` | `0` | Filled at timer end |

---

## 6. Phase 3: Quiz Assessment

### 6.1 Quiz Flowchart

```mermaid
flowchart TD
    Q0([Navigate to QuizScreen]) --> Q1[Fetch questions from QuizBank.json]
    Q1 --> Q2{Questions found for topicId?}
    Q2 -- No --> Q3[Show empty state — no quiz available]
    Q3 --> Q4[Skip to SessionSummary with score 0]
    Q2 -- Yes --> Q5[Initialize questionIndex = 0]
    Q5 --> Q6[Initialize score = 0]
    Q6 --> Q7[Render Question Card + 4 Options]

    Q7 --> Q8[User selects an option]
    Q8 --> Q9{Selected index === correctIndex?}
    Q9 -- Yes --> Q10[Mark Green + Checkmark]
    Q10 --> Q11[score += 1]
    Q11 --> Q12[Show Explanation Card]
    Q9 -- No --> Q13[Mark Red + X]
    Q13 --> Q14[Show correct answer]
    Q14 --> Q12

    Q12 --> Q15{Last question?}
    Q15 -- No --> Q16[questionIndex += 1]
    Q16 --> Q7
    Q15 -- Yes --> Q17[Calculate final score]
    Q17 --> Q18[Navigate to SessionSummary]
```

### 6.2 Quiz State Variables

| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `questions` | `QuizQuestion[]` | `[]` | Fetched from QuizBank |
| `currentQuestionIndex` | `number` | `0` | Current question pointer |
| `score` | `number` | `0` | Running correct answer count |
| `selectedOptionIndex` | `number \| null` | `null` | User's current selection |
| `showExplanation` | `boolean` | `false` | Explanation card visibility |
| `isAnswerCorrect` | `boolean \| null` | `null` | Result of current selection |

---

## 7. Phase 4: Session Summary & Persistence

### 7.1 Summary & Save Flowchart

```mermaid
flowchart TD
    P0([Navigate to SessionSummaryScreen]) --> P1[Assemble StudySession object]
    P1 --> P2[Render Celebration Badge]
    P2 --> P3[Render Score Card]
    P3 --> P4[Render Stats Grid]

    P4 --> P5[User taps FINISH & SAVE]
    P5 --> P6[Serialize StudySession to JSON]
    P6 --> P7[Write to AsyncStorage / MMKV]
    P7 --> P8{Write successful?}
    P8 -- Yes --> P9[Show success feedback]
    P9 --> P10[Navigate to GoalInputScreen]
    P10 --> P11([Flow Complete — Reset])
    P8 -- No --> P12[Show error toast]
    P12 --> P13[Retry save]
    P13 --> P6
```

### 7.2 StudySession Object Assembly

```typescript
const session: StudySession = {
  id: generateUUID(),
  goalText: goalText,
  topicId: topicId,
  targetDurationSeconds: targetDurationSeconds,
  actualDurationSeconds: actualDurationSeconds,
  distractionAttempts: distractionAttempts,
  quizScore: quizScore,
  totalQuizQuestions: totalQuizQuestions,
  isCompleted: isCompleted,
  timestamp: new Date().toISOString(),
};
```

### 7.3 Summary Display Data

| Stat | Source | Format |
|------|--------|--------|
| Focus Duration | `actualDurationSeconds` | `MM:SS` or `HH:MM:SS` |
| Topic Studied | `goalText` | Text |
| Distraction Count | `distractionAttempts` | Integer |
| Apps Blocked | `blockedApps.length` | Integer |
| Quiz Score | `quizScore / totalQuizQuestions` | `X / Y Correct` |

---

## 8. Complete State Transition Table

| # | Current State | Event / Condition | Next State | Side Effects |
|---|--------------|-------------------|------------|--------------|
| 1 | `Idle` | App launch | `GoalInput` | — |
| 2 | `GoalInput` | Goal text filled + NEXT | `AppBlockerSetup` | Store `goalText`, `topicId` |
| 3 | `AppBlockerSetup` | Apps selected + NEXT | `TimerSetup` | Store `blockedApps[]` |
| 4 | `TimerSetup` | Duration set + START FOCUS | `FocusActive` | Store `targetDurationSeconds` |
| 5 | `FocusActive` | Shield activated | `CountdownRunning` | `isShieldActive = true` |
| 6 | `CountdownRunning` | Restricted app opened | `DistractionDetected` | — |
| 7 | `DistractionDetected` | Warning shown | `CountdownRunning` | `distractionAttempts++` |
| 8 | `CountdownRunning` | Timer reaches 00:00:00 | `TimerComplete` | `isCompleted = true` |
| 9 | `CountdownRunning` | Give Up confirmed | `UserGiveUp` | `isCompleted = false` |
| 10 | `TimerComplete` | Shield deactivated | `QuizAssessment` | `isShieldActive = false`, haptic + sound |
| 11 | `UserGiveUp` | Shield deactivated | `SessionSave` | `isShieldActive = false` |
| 12 | `QuizAssessment` | All questions answered | `SessionSave` | Calculate `quizScore` |
| 13 | `SessionSave` | Persisted to storage | `SummaryDisplay` | Write to AsyncStorage/MMKV |
| 14 | `SummaryDisplay` | FINISH & SAVE | `Idle` | Navigate to `GoalInput` |

---

## 9. Data Flow Diagram

```mermaid
flowchart LR
    subgraph UI[UI Layer]
        A[GoalInputScreen]
        B[AppBlockerSetupScreen]
        C[TimerSetupScreen]
        D[FocusTimerScreen]
        E[QuizScreen]
        F[SessionSummaryScreen]
    end

    subgraph State[State Management — Zustand / Context]
        G[SessionStore]
        H[TimerStore]
        I[QuizStore]
    end

    subgraph Services[Services Layer]
        J[AppRestrictionService]
        K[TimerService]
        L[HapticService]
        M[StorageService]
    end

    subgraph Data[Data Layer]
        N[QuizBank.json]
        O[AsyncStorage / MMKV]
        P[(Backend API — future)]
    end

    A --> G
    B --> G
    C --> H
    D --> H
    D --> J
    D --> L
    E --> I
    E --> N
    F --> M
    F --> O
    M --> P
```

---

## 10. Edge Cases & Error Handling

### 10.1 Edge Case Flowchart

```mermaid
flowchart TD
    E1[App killed during Focus Mode] --> E1a[Timer lost — session not saved]
    E1a --> E1b[On relaunch: detect orphaned session]
    E1b --> E1c[Prompt user: resume or discard]

    E2[User swipes app to background] --> E2a[Timer continues running]
    E2a --> E2b[Shield remains active]
    E2b --> E2c[On return: timer still counting]

    E3[All quiz questions answered incorrectly] --> E3a[Score = 0]
    E3a --> E3b[Show encouragement message]
    E3b --> E3c[Proceed to SessionSummary]

    E4[No quiz available for topicId] --> E4a[Skip quiz phase]
    E4a --> E4b[SessionSummary with score 0 / 0]

    E5[Storage write fails] --> E5a[Show error toast]
    E5a --> E5b[Retry save]
    E5b --> E5c{Retry successful?}
    E5c -- Yes --> E5d[Proceed to GoalInput]
    E5c -- No --> E5e[Keep data in memory, prompt again]

    E6[User rapidly taps Give Up] --> E6a[Confirmation Alert prevents accidental tap]
    E6a --> E6b[Only explicit confirm triggers give up]
```

### 10.2 Edge Case Summary

| Edge Case | Handling Strategy |
|-----------|-------------------|
| App killed during focus | Detect orphaned session on relaunch; prompt resume/discard |
| App backgrounded during focus | Timer continues; shield stays active |
| All quiz answers wrong | Score = 0; show encouragement; proceed to summary |
| No quiz for topic | Skip quiz; summary shows `0 / 0` |
| Storage write failure | Error toast + retry loop |
| Rapid Give Up taps | Confirmation Alert guards against accidental activation |
| Empty goal text | NEXT button disabled |
| No apps selected | NEXT button disabled |
| Zero duration | START FOCUS button disabled |

---

## Appendix: Screen-to-Phase Mapping

| Screen | Phase | Key State | Exit Condition |
|--------|-------|-----------|----------------|
| `GoalInputScreen` | Setup | `goalText`, `topicId` | NEXT → AppBlockerSetup |
| `AppBlockerSetupScreen` | Setup | `blockedApps[]` | NEXT → TimerSetup |
| `TimerSetupScreen` | Setup | `targetDurationSeconds` | START FOCUS → FocusTimer |
| `FocusTimerScreen` | Focus | `remainingSeconds`, `distractionAttempts`, `isShieldActive` | Timer end → Quiz; Give Up → Summary |
| `QuizScreen` | Assessment | `questions[]`, `score`, `currentQuestionIndex` | Last question → Summary |
| `SessionSummaryScreen` | Summary | `StudySession` object | FINISH & SAVE → GoalInput |

---

*End of Focus Mode System Logic Flowchart*
