# ARCHITECTURE

## Pattern
- **Web App Architecture:** Full-stack monolithic architecture using Next.js App Router.
- **Client/Server split:** Serverless API routes under `src/app/api/` handle backend logic, while client/server components interact with local state or fetch data.
- **Database Layer:** Prisma ORM connecting to PostgreSQL database.

## Key Layers
- **Routing Layer (`src/app`):** Defines pages and API routes.
- **Component Layer (`src/components`):** Reusable UI building blocks (e.g., `PuzzleBoard.tsx`, `Dashboard.tsx`).
- **Service Layer (`src/lib`):** Holds authentication logic (`auth.ts`), database configuration (`db.ts`, `prisma.ts`), rate limiting (`ratelimit.ts`), and Redux store.

## Data Flow
1. Client actions trigger Redux state changes or direct API calls via Axios.
2. Next.js API Routes (`src/app/api/`) validate requests with Zod.
3. Protected routes use NextAuth sessions for authorization.
4. API Routes communicate with the database via Prisma or Upstash Redis for rate-limiting.
5. Client consumes API response and updates UI or Redux slice state.
