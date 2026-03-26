# TESTING

## Frameworks
- **Test Runner:** Jest (configured via `jest.config.ts`)
- **DOM Testing:** React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- **TypeScript:** `ts-jest` for running TS tests natively in Jest.

## Setup
- Environment: jsdom (`jest-environment-jsdom`) is used to mock the browser environment.
- Setup script: `jest.setup.ts` initializes globally needed mocks or jest-dom matchers.

## Execution
- Typical execution involves `npm test` mapping to Jest CLI.

## Coverage
- Test coverage specifics are not explicitly codified but all tooling exists for extensive unit and component integration testing.
