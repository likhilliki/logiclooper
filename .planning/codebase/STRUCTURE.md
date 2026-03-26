# STRUCTURE

## Directory Layout
- `prisma/`: Database schema (`schema.prisma`) and migrations.
- `public/`: Static assets (images, icons).
- `src/`: Main source code directory.
  - `src/app/`: Next.js App Router root.
    - `src/app/api/`: Backend serverless endpoints (e.g., `auth/`, `scores/`, `user/`).
    - `layout.tsx`, `page.tsx`: Application shell and main entry pages.
  - `src/components/`: Reusable React components (`Dashboard.tsx`, `PuzzleBoard.tsx`, `StreakHeatmap.tsx`, `Providers.tsx`).
  - `src/lib/`: Shared utilities, configurations, and internal libraries.
    - `db.ts`, `prisma.ts`: Database client instantiation.
    - `auth.ts`: NextAuth configuration and providers setup.
    - `ratelimit.ts`: Upstash rate limiting definitions.
    - `store/`: Global Redux store.
    - `puzzles/`: Puzzle generation or handling logic.
  - `src/types/`: TypeScript interfaces and shared type declarations.

## Key Entry Points
- Frontend App Root: `src/app/layout.tsx` and `src/app/page.tsx`.
- Backend Auth Endpoint: `src/app/api/auth/[...nextauth]/route.ts` (conventional NextAuth route).
