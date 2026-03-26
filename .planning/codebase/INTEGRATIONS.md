# INTEGRATIONS

## Database
- **PostgreSQL:** Primary relational database managed by Prisma. Models include `User`, `Account`, `Session`, `DailyScore`, `UserStats`.

## Cache & Rate Limiting
- **Upstash Redis:** Accessed via `@upstash/redis` and `@upstash/ratelimit` for mitigating API abuse and implementing high-speed transient storage limits.

## Authentication
- **NextAuth.js:** Provides comprehensive authentication workflows, backed by `@next-auth/prisma-adapter` linking users to the Prisma schema (`Account`, `Session`, `VerificationToken`, `User`).

## Cryptography
- **Crypto-js:** Available for cryptographic operations (hashing, encryption on the client or lightweight endpoints).
