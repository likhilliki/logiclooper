# STACK

## Recommended Stack
- **Frontend**: Next.js App Router (React 19), Redux Toolkit, Tailwind CSS, Framer Motion.
- **Backend/DB**: Next.js API Routes, Postgres (using Neon Serverless), Prisma ORM.
- **Local Storage**: IndexedDB via `idb` for resilient offline play, Redux Persist for local UI state.
- **Cryptography**: `crypto-js` for deterministic puzzle generating strings and anti-tamper signing.

## Rationale
- **Zero-Latency**: Client-first execution with IndexedDB ensures puzzles solve instantly.
- **Serverless Postgres (Neon)**: Great for handling the spiky traffic typically seen in daily games (e.g. at midnight).
- **Redux**: Ideal for keeping track of complex logic constraints across varying puzzle types.

## What Not To Use
- **WebSockets / Server-Sent Events**: Overhead is unnecessary for asynchronous daily games. Keep it REST-based.
