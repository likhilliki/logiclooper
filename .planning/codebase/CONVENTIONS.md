# CONVENTIONS

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
