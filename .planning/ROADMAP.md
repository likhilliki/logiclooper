# ROADMAP

## Overview

**4 phases** | **17 requirements mapped** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Offline Puzzle Engine | Standalone deterministic puzzle generator with local validation | ENG-04, ENG-05, ENG-06, ENG-07, MCH-04 | 4 |
| 2 | Daily Engagement Limits | 365-day rotation with time-locked access, heatmap, and hints | ENG-01, ENG-02, ENG-03, MCH-01, MCH-02, MCH-03 | 4 |
| 3 | Identity & Authentication | Non-blocking login via Google Oauth, Truecaller, or Guest | AUTH-01, AUTH-02, AUTH-03 | 3 |
| 4 | Social & Leaderboards | Server sync for top 100 users, badges, and URL challenges | SOC-01, SOC-02, SOC-03 | 3 |

---

## Phase Details

### Phase 1: Offline Puzzle Engine
**Goal**: Standalone deterministic puzzle generator with local validation
**Requirements**: ENG-04, ENG-05, ENG-06, ENG-07, MCH-04
**Success Criteria**:
1. Changing the system date/seed identically recreates the same puzzle matrix consistently mapping across all 5 logic types.
2. A filled out puzzle grid is locally validated for correctness showing an error or success animation instantly.
3. Reloading the page in the middle of a solve loads the exact move history from IndexedDB.
4. Turning off internet preserves full functionality to complete a puzzle.

### Phase 2: Daily Engagement Limits
**Goal**: 365-day rotation with time-locked access, heatmap, and hints
**Requirements**: ENG-01, ENG-02, ENG-03, MCH-01, MCH-02, MCH-03
**Success Criteria**:
1. User is visibly blocked from playing "tomorrow's" puzzle until midnight local time.
2. Streak UI correlates perfectly with the consecutive days solved in IndexedDB, showing a styled heatmap grid.
3. Solving times are recorded and mapped to variable difficulty thresholds for the next puzzle.
4. User clicks "Hint", consumes 1 of their daily limit (deducted in local storage), and receives accurate logical guidance.

### Phase 3: Identity & Authentication
**Goal**: Non-blocking login via Google Oauth, Truecaller, or Guest
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria**:
1. User can click "Sign in with Google", storing a valid Session without breaking local IndexedDB puzzle states.
2. Truecaller OTP/Login SDK renders and resolves smoothly on compatible devices.
3. A user explicitly clicking "Play as Guest" receives an anonymous identifier keeping their heatmap exclusively local.

### Phase 4: Social & Leaderboards
**Goal**: Server sync for top 100 users, badges, and URL challenges
**Requirements**: SOC-01, SOC-02, SOC-03
**Success Criteria**:
1. A win triggers an asynchronous POST to the API that inserts into Postgres. If successful, the global rank is returned and displayed in top 100.
2. User can easily copy a generated URL (containing base64 or custom encoded parameters) that lets another user load their exact generated constraint ghost run.
3. Local UI unlocks visual badges upon reaching specific milestones (e.g., "7 Day Streak", "1 Minute Solve").
