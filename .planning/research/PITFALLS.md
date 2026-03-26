# PITFALLS

## Critical Mistakes

1. **Local Clock Cheating**
   - *Warning Sign*: Users playing future puzzles.
   - *Prevention*: Fetch a lightweight, highly-cached timestamp from the server API on startup instead of relying purely on `new Date()`.
   
2. **Database Overload at Midnight**
   - *Warning Sign*: Neon connection pooling errors at 00:00. (Note: A connection issue was already observed during `npm run dev`).
   - *Prevention*: Never fetch the puzzle from the database at midnight. The client computes it! Only write scores and ensure the Prisma pool size is appropriately managed for rapid POSTs. Decouple connection pooler limits.

3. **Complex State Synchronization**
   - *Warning Sign*: Lost progress between devices.
   - *Prevention*: Strict "last-write-wins" logic handled gently by checking the `last_played` API timestamp before blindly overwriting on device load.
