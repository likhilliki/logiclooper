# Logic Looper

## What This Is

An engaging daily puzzle game that combines logic challenges with streak-based motivation systems. It hooks users with progressive difficulty and streak rewards, designed for daily engagement over 365 days with minimal server dependency.

## Core Value

Client-First Architecture: Maximum logic mechanics run locally to keep the game highly interactive, zero-latency, and cost-efficient for 365 days of play.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ [Auth] Setup NextAuth.js framework
- ✓ [Database] Postgres Schema defined for Users, UserStats, DailyScores
- ✓ [Infrastructure] Next.js App Router, Tailwind CSS, Redux Toolkit layout scaffolding

### Active

<!-- Current scope. Building toward these. -->

- [ ] [Daily Engagement] 365 Unique Puzzles pre-generated/dynamically seeded for 1 year
- [ ] [Daily Engagement] Daily Reset unlocking new puzzle at midnight local time
- [ ] [Daily Engagement] Visual streak indicator and year-long heatmap display
- [ ] [Client Logic] Puzzle generator (deterministic by date seed) and offline support via IndexedDB
- [ ] [Client Logic] Client-side puzzle validation and progress saver
- [ ] [Game Types] Rotate puzzle types daily (Number Matrix, Pattern Matching, Sequence, Deduction, Binary)
- [ ] [Mechanics] Time-based rewards, auto-adjusting difficulty, and hint limits
- [ ] [Auth] Google OAuth 2.0, Truecaller SDK Integration, & Guest Mode
- [ ] [Social] Daily Leaderboards (Top 100 synced to server) and Friend Challenges via URL sharing
- [ ] [Social] Client-side Achievements/Badges

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Server-Side Game State] — To minimize read/write operations and keep DB costs virtually free.
- [Real-time Multiplayer] — Focus is on daily asynchronous engagement, not synchronous load.

## Context

- Building a puzzle challenge platform intended to run reliably with almost zero operational cost.
- Heavy reliance on client-side computation (Crypto-js, deterministic generation, IndexedDB) to avoid backend scaling costs.
- Codebase mapping confirmed that Prisma schema, core layout, and NextAuth boilerplate are already initialized.

## Constraints

- **Architecture**: Minimalist Backend — Server operations strictly limited to Leaderboard sync and Auth.
- **Tech Stack**: React 18+, Redux Toolkit, Framer Motion, Next.js, Prisma, Upstash Redis.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deterministic Generation | Avoids needing DB storage for 365 complex puzzles | — Pending |
| IndexedDB for Progress | True offline support, zero latency | — Pending |
| Truecaller Web SDK | Easiest zero-friction login for mobile web users | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
