# Phase 1: GOAL SETUP (iOS Mobile App)

- Target Platform: iOS (SwiftUI)
- Aspect Ratio: 9:16 (iPhone portrait)
- Design Theme: Modern Minimalist, Clean, Soft Shadows.
- Color Palette:
  - Background: System Light/Dark Adaptive (#F2F2F7 in Light)
  - Primary Accent: Deep Orange/Coral (#FF6B4A - Classic Pomodoro energy)
  - Card/Container Background: White (#FFFFFF) with 16pt corner radius.

---

## Page 1: Goal Input (`GoalInputView`)

- Navigation:
  - Header: Large title "Set Your Goal" (Font: Bold, 28pt).
  - Top Right: Page indicator "Step 1 of 3".
- Content Components:
  1. Goal Text Box:
     - Placeholder: "What are you studying today? (e.g., Chapter 3 History...)"
     - Style: Rounded rectangle, subtle border, multi-line support.
  2. Document Attachment Section:
     - Section Title: "Study Materials (Optional)"
     - UI: A 2x2 Grid block.
     - Empty State: Dashed border card with a (+) icon and text "Add PDF or Image".
     - Populated State: Shows file thumbnail/icon, filename, and a small (X) button to remove.
- Bottom Action:
  - "NEXT" Button: Full-width, Primary Accent color, rounded-pill shape.
  - Logic: Enabled when the Goal text box is filled. Tapping navigates to Page 2.

---

## Page 2: Distraction App Blocker (`AppBlockerSetupView`)

- Navigation:
  - Top Left: Back arrow button (<) to return to Page 1.
  - Top Right: Page indicator "Step 2 of 3".
- Content Components:
  1. Header/Instruction:
     - Title: "Block Distractions" (Font: Bold, 24pt).
     - Subtitle: "Select apps & categories you want to restrict during focus time."
  2. Selected Apps Summary Card:
     - Shows a preview count (e.g., "3 Apps & 1 Category Selected").
     - Quick icons list of selected app categories (Social, Games, Entertainment), default is Facebook,Instagram,Tiktok
  3. FamilyActivityPicker Button (iOS Native Screen Time API Integration):
     - A clear action button: "Select Apps to Block" with an iOS Screen Time icon.
     - Tapping this opens the native iOS `FamilyActivityPicker` modal overlay for app/category selection.
  4. Quick Presets (Optional for MVP UX):
     - Toggle switches for common distractions: "Social Media", "Games", "Streaming".
- Bottom Action:
  - "NEXT" Button: Full-width, Primary Accent color.
  - Logic: Tapping saves selected `FamilyActivitySelection` and navigates to Page 3.

---

## Page 3: Timer Setup (`TimerSetupView`)

- Navigation:

  - Top Left: Back arrow button (<) to return to Page 2.
  - Top Right: Page indicator "Step 3 of 3".
- Content Components:

  1. Header/Summary:
     - Title: "Focus Duration" (Font: Bold, 24pt).
     - Subtitle: A small summary badge showing the chosen Goal + Selected Apps count.
  2. Timer Picker:
     - iOS Native Style Wheel Picker (3 columns: Hours | Minutes | Seconds).
     - Default Value: 00 Hours | 25 Minutes | 00 Seconds.
     - Quick Select Chips above picker: "15m", "25m", "45m", "60m".
- Bottom Action:

  - "START FOCUS" Button: Full-width, bold primary color.
  - Logic: Tapping activates `ManagedSettingsStore` (Screen Time Shield) and transitions to the Focus/Timer Phase.

  # Phase 2: FOCUS MODE (Timer & Restrictions Active)


  - Target Platform: iOS (SwiftUI)
  - Aspect Ratio: 9:16 (iPhone portrait)
  - Theme: Deep Focus Mode (Support dark background or clean high-contrast UI to reduce visual stress).

  ## Page 4: Active Pomodoro Timer (`FocusTimerView`)

  - State: Screen Time Shield (`ManagedSettingsStore`) is currently ACTIVE. Selected apps are blocked.
  - Navigation:

    - No top back button (prevents accidental exit).
    - Minimalistic header displaying current Goal Topic (e.g., "Goal: Chapter 3 History").
  - Content Components:

    1. Circular Timer Display:
       - Large central countdown clock (Format: `MM:SS` or `HH:MM:SS`).
       - Smooth circular progress ring (Primary Accent Color fill) reducing over time.
       - Status Indicator: Small badge displaying "Shield Active 🔒" or "Apps Blocked".
    2. Encouraging Quote / Tip:
       - A subtle text card at the bottom displaying motivational focus tips.
    3. Emergency Action:
       - A low-prominence "Give Up / End Early" button at the bottom.
       - Tapping shows a confirmation Alert: "Ending early will record this session as incomplete. Are you sure?"
  - Phase Transition:

    - When countdown reaches 00:00:00:
      1. Triggers haptic feedback & light completion sound.
      2. Deactivates Screen Time Shield (`ScreenTimeManager.shared.stopRestriction()`).
      3. Automatically transitions seamlessly to Phase 3: `QuizView`.Phase 3: QUIZ & SUMMARY (Post-Session Assessment)
  - Target Platform: iOS (SwiftUI)
  - Aspect Ratio: 9:16
  - Data Source: Pre-generated Local Quiz Bank (`QuizBank.json`) matched by `TopicID`.

  ## Page 5: Multiple Choice Quiz (`QuizView`)

  - Navigation:
    - Header: Topic title + Question Progress Bar (e.g., "Question 2 of 3").
    - No back or skip button (forces user to complete assessment).
  - Content Components:
    1. Question Card:
       - Prominent white card with soft shadow displaying the question text clearly.
    2. Answer Options (4 Multiple-Choice Buttons):
       - Vertical stack of 4 options (A, B, C, D).
       - Interactive States:
         - Default: Neutral border, plain background.
         - Selected - Correct: Turns Green with a checkmark icon (✓).
         - Selected - Incorrect: Turns Red with an (X) icon, revealing the correct option in Green.
    3. Explanation Popup / Card (Appears after answer selection):
       - Brief explanation text clarifying why the correct answer is right.
    4. Bottom Action:
       - "Next Question" / "View Summary" Button: Full-width, appears after selecting an option.

  ---

  ## Page 6: Session Summary (`SessionSummaryView`)

  - Navigation:
    - Top Header: Celebration icon / Badge (e.g., Trophy 🏆 or Party Popper 🎉).
    - Title: "Session Complete!"
  - Content Components:
    1. Score & Performance Card:
       - Big bold score (e.g., "3 / 3 Correct").
       - Feedback badge based on accuracy:
         - 100%: "Mastered! Outstanding focus!"
         - 50-80%: "Good job! Review a bit more."
         - <50%: "Keep practicing! You'll get it next time."
    2. Session Stats Grid:
       - Focus Duration: e.g., "25 mins".
       - Topic Studied: e.g., "Chapter 3 History".
       - Apps Blocked: e.g., "3 Apps".
  - Bottom Action:
    - "FINISH & SAVE" Button: Full-width primary button.
    - Logic: Saves session stats to local database (SwiftData / UserDefaults) and returns to the main Home/Setup screen.

  # Phase 2: FOCUS MODE (Timer & Restrictions Active)

  - Target Platform: iOS (SwiftUI)
  - Aspect Ratio: 9:16 (iPhone portrait)
  - Theme: Deep Focus Mode (Support dark background or clean high-contrast UI to reduce visual stress).

  ## Page 4: Active Pomodoro Timer (`FocusTimerView`)

  - State: Screen Time Shield (`ManagedSettingsStore`) is currently ACTIVE. Selected apps are blocked.
  - Navigation:
    - No top back button (prevents accidental exit).
    - Minimalistic header displaying current Goal Topic (e.g., "Goal: Chapter 3 History").
  - Content Components:
    1. Circular Timer Display:
       - Large central countdown clock (Format: `MM:SS` or `HH:MM:SS`).
       - Smooth circular progress ring (Primary Accent Color fill) reducing over time.
       - Status Indicator: Small badge displaying "Shield Active 🔒" or "Apps Blocked".
    2. Encouraging Quote / Tip:
       - A subtle text card at the bottom displaying motivational focus tips.
    3. Emergency Action:
       - A low-prominence "Give Up / End Early" button at the bottom.
       - Tapping shows a confirmation Alert: "Ending early will record this session as incomplete. Are you sure?"
  - Phase Transition:
    - When countdown reaches 00:00:00:
      1. Triggers haptic feedback & light completion sound.
      2. Deactivates Screen Time Shield (`ScreenTimeManager.shared.stopRestriction()`).
      3. Automatically transitions seamlessly to Phase 3: `QuizView`.

  ---

  # Phase 3: QUIZ & SUMMARY (Post-Session Assessment)

  - Target Platform: iOS (SwiftUI)
  - Aspect Ratio: 9:16
  - Data Source: Pre-generated Local Quiz Bank (`QuizBank.json`) matched by `TopicID`.

  ## Page 5: Multiple Choice Quiz (`QuizView`)

  - Navigation:
    - Header: Topic title + Question Progress Bar (e.g., "Question 2 of 3").
    - No back or skip button (forces user to complete assessment).
  - Content Components:
    1. Question Card:
       - Prominent white card with soft shadow displaying the question text clearly.
    2. Answer Options (4 Multiple-Choice Buttons):
       - Vertical stack of 4 options (A, B, C, D).
       - Interactive States:
         - Default: Neutral border, plain background.
         - Selected - Correct: Turns Green with a checkmark icon (✓).
         - Selected - Incorrect: Turns Red with an (X) icon, revealing the correct option in Green.
    3. Explanation Popup / Card (Appears after answer selection):
       - Brief explanation text clarifying why the correct answer is right.
    4. Bottom Action:
       - "Next Question" / "View Summary" Button: Full-width, appears after selecting an option.

  ---

  ## Page 6: Session Summary (`SessionSummaryView`)

  - Navigation:
    - Top Header: Celebration icon / Badge (e.g., Trophy 🏆 or Party Popper 🎉).
    - Title: "Session Complete!"
  - Content Components:
    1. Score & Performance Card:
       - Big bold score (e.g., "3 / 3 Correct").
       - Feedback badge based on accuracy:
         - 100%: "Mastered! Outstanding focus!"
         - 50-80%: "Good job! Review a bit more."
         - <50%: "Keep practicing! You'll get it next time."
    2. Session Stats Grid:
       - Focus Duration: e.g., "25 mins".
       - Topic Studied: e.g., "Chapter 3 History".
       - Apps Blocked: e.g., "3 Apps".
  - Bottom Action:
    - "FINISH & SAVE" Button: Full-width primary button.
    - Logic: Saves session stats to local database (SwiftData / UserDefaults) and returns to the main Home/Setup screen.
