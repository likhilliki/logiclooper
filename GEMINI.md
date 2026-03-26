<!-- GSD:project-start source:PROJECT.md -->
## Project

**Logic Looper**

An engaging daily puzzle game that combines logic challenges with streak-based motivation systems. It hooks users with progressive difficulty and streak rewards, designed for daily engagement over 365 days with minimal server dependency.

**Core Value:** Client-First Architecture: Maximum logic mechanics run locally to keep the game highly interactive, zero-latency, and cost-efficient for 365 days of play.

### Constraints

- **Architecture**: Minimalist Backend — Server operations strictly limited to Leaderboard sync and Auth.
- **Tech Stack**: React 18+, Redux Toolkit, Framer Motion, Next.js, Prisma, Upstash Redis.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Core
- **Framework:** Next.js 16.2.1 (App Router)
- **UI Library:** React 19.2.4
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4, `clsx`, `tailwind-merge`
- **Animations:** `framer-motion`
## State & Data
- **Global State:** Redux Toolkit (`@reduxjs/toolkit`), `react-redux`
- **Database ORM:** Prisma 5.22.0
- **Caching/Storage:** Upstash Redis (`@upstash/redis`), IndexedDB (`idb`)
## Backend & API
- **Auth:** NextAuth.js 4.24.13 (`next-auth`), `@next-auth/prisma-adapter`
- **Rate Limiting:** Upstash Ratelimit (`@upstash/ratelimit`)
- **Validation:** Zod
- **Fetching:** Axios
## Developer Tools
- **Linting & Formatting:** ESLint 9, Prettier
- **Testing:** Jest, React Testing Library
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- Use TypeScript strict mode across all modules.
- Prettier and ESLint enforce code formatting and catch style regressions automatically.
- Next.js server components are preferred unless client-side interactivity (`useState`, `useEffect`) is needed.
## Naming conventions
- `PascalCase` for React components (e.g., `PuzzleBoard.tsx`).
- `camelCase` for directories and utility files (e.g., `ratelimit.ts`, `auth.ts`).
- App Router features use Next.js conventional filenames (`page.tsx`, `layout.tsx`, `route.ts`).
## Error Handling
- Use Zod schemas for input validation in API routes.
- Next.js error boundaries (if applicable) for component-level crash recovery.
## State Management
- Complex global state managed by Redux Toolkit slices (`src/lib/store`).
- Local UI state using React hooks.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
- **Web App Architecture:** Full-stack monolithic architecture using Next.js App Router.
- **Client/Server split:** Serverless API routes under `src/app/api/` handle backend logic, while client/server components interact with local state or fetch data.
- **Database Layer:** Prisma ORM connecting to PostgreSQL database.
## Key Layers
- **Routing Layer (`src/app`):** Defines pages and API routes.
- **Component Layer (`src/components`):** Reusable UI building blocks (e.g., `PuzzleBoard.tsx`, `Dashboard.tsx`).
- **Service Layer (`src/lib`):** Holds authentication logic (`auth.ts`), database configuration (`db.ts`, `prisma.ts`), rate limiting (`ratelimit.ts`), and Redux store.
## Data Flow
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
