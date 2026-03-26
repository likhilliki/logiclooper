# REQUIREMENTS

## v1 Requirements

### Daily Engagement
- [ ] **ENG-01**: User can unlock a single new pre-generated puzzle locally at midnight.
- [ ] **ENG-02**: User can view their streak indicator based on daily win continuity.
- [ ] **ENG-03**: User can view a year-long 365 heatmap history of solved challenges.

### Client-Side Engine
- [ ] **ENG-04**: System generates grids/logic structures using a deterministic date seed without querying.
- [ ] **ENG-05**: Client validates puzzle state completion instantly.
- [ ] **ENG-06**: IndexedDB saves every move, stopping users from losing progress on accidental refresh.
- [ ] **ENG-07**: Application runs fully offline after the UI bundle is served.

### Game Mechanics
- [ ] **MCH-01**: Engine progressively adjusts difficulty based on prior win times or points.
- [ ] **MCH-02**: Engine records puzzle solve times. Sub-par times yield less bonus points.
- [ ] **MCH-03**: User utilizes limited hints (quota tracked locally).
- [ ] **MCH-04**: User plays sequentially varying puzzle types (Number, Pattern, Sequence, Deduction, Binary).

### Authentication
- [ ] **AUTH-01**: User can authenticate securely with Google OAuth 2.0.
- [ ] **AUTH-02**: User can authenticate quickly with Truecaller SDK.
- [ ] **AUTH-03**: User can play un-authenticated (Guest Mode) with local features intact.

### Social
- [ ] **SOC-01**: User can view Global Top 100 Daily Leaderboards (Server Synced).
- [ ] **SOC-02**: User can share customized puzzle states/ghosts as copyable URLs to challenge friends.
- [ ] **SOC-03**: User earns visual logic badges/achievements locally.

## v2 Requirements
*(Deferred capabilities not defined in v1)*

## Out of Scope
- **Server State Syncing / Multiplayer**: Focus is pure client-side interaction with post-solve tallying to dodge high server read costs.
- **Premium DLC Puzzles**: Keep it free and engaging directly first.

## Traceability
*(Will be mapped to execution phases)*
