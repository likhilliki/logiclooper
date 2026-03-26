# FEATURES

## Table Stakes (Must-Have)
- A reliable daily countdown and unlocking mechanism.
- Clear error and success visual feedback during puzzles.
- Persistence of partial puzzle progress across browser reloads.
- Uncomplicated user authentication (Google / guest-fallback).

## Differentiators (Competitive Advantage)
- Client-side deterministic seeding: 365 puzzles requiring zero database payload fetches per day.
- Visual streak mapping (similar to GitHub contribution history).
- Silky micro-animations powered by Framer Motion corresponding to puzzle movements.

## Anti-features (Do NOT build)
- Real-time synchronous multiplayer (adds high maintenance overhead without scaling daily retention).
- Server-side gameplay validation (creates network bottleneck latency).
