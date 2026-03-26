# CONCERNS

## Tech Debt & Fragile Areas
- **Next.js & React 19 Upgrade:** Next.js 16.x and React 19 are bleeding edge. Third-party packages might experience issues or throw warnings around peer dependencies or concurrent features.
- **Redux / App Router Interop:** Handling client-side Redux stores reliably across Next.js server component boundaries can be complex and requires dedicated context provider wrappers (e.g., `Providers.tsx`).

## Security
- **API Rate Limits:** Basic rate limiting is established via Upstash, but endpoints must be thoroughly audited to ensure all authenticated and unauthenticated pathways are adequately metered.

## Performance
- **IndexedDB:** Puzzles or state caching may leverage IndexedDB (`idb`). Performance should be profiled if payload sizes grow exponentially.
