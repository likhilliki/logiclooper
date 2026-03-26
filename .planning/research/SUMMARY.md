# RESEARCH SUMMARY

## Key Findings

- **Stack Context**: Building with Next.js App Router, Redux, IndexedDB, and Neon Postgres enables a highly cost-efficient structure built on Client-Side execution.
- **Client Dominance**: By using deterministic algorithmic generation based on local or fetched timestamps, server querying is completely bypassed for puzzle fetching.
- **Database Connection Risks**: The current `npm run dev` threw a Neon connection pooler error. This reconfirms the research thesis: heavy reliance on server-side database connections is fragile for this app. We absolutely must adhere to the offline-first strategy and manage connection pools/limits diligently for auth/scoring API endpoints.
- **Gameplay Architecture**: The application separates strictly between "Game Engine" (pure client-side logic), "State Runner" (Redux & IndexedDB), and "High Score Syc" (Postgres via Prisma).
