# Testing Guide

This document provides comprehensive information about testing in the Daily Report Management System.

## Test Structure

```
drm/
├── frontend/
│   ├── src/
│   │   ├── test/
│   │   │   ├── setup.ts                 # Test setup and global mocks
│   │   │   └── utils.tsx               # Test utilities and custom render
│   │   ├── components/__tests__/       # Component unit tests
│   │   └── services/__tests__/         # Service unit tests
│   └── vite.config.ts                  # Vitest configuration
├── backend/
│   ├── tests/
│   │   ├── setup.ts                    # Jest setup
│   │   ├── globalSetup.ts              # Global test setup
│   │   ├── globalTeardown.ts           # Global test cleanup
│   │   └── controllers/                # Controller unit tests
│   └── jest.config.js                  # Jest configuration
├── e2e/
│   ├── daily-report.spec.ts            # E2E tests for daily reports
│   ├── api.spec.ts                     # API integration tests
│   ├── global-setup.ts                 # E2E setup
│   └── global-teardown.ts              # E2E cleanup
├── scripts/
│   ├── test-all.sh                     # Complete test suite
│   └── test-dev.sh                     # Development testing
└── playwright.config.ts                # Playwright configuration
```

## Test Types

### 1. Frontend Unit Tests (Vitest + React Testing Library)

**Location**: `frontend/src/**/__tests__/`

**Technologies**:
- Vitest for test runner
- React Testing Library for component testing
- @testing-library/jest-dom for DOM assertions
- @testing-library/user-event for user interactions

**What we test**:
- Component rendering and behavior
- Service layer logic
- State management (Zustand stores)
- Custom hooks
- Utility functions

**Example**:
```bash
cd frontend
npm run test                 # Run tests once
npm run test:mock           # Run with mock services
npm run test:coverage       # Run with coverage report
npm run test:ui             # Run with UI interface
```

### 2. Backend Unit Tests (Jest + Supertest)

**Location**: `backend/tests/`

**Technologies**:
- Jest for test runner
- Supertest for HTTP testing
- Mock implementations for database and external services

**What we test**:
- API endpoints and HTTP responses
- Controller logic
- Service layer functions
- Data validation
- Error handling

**Example**:
```bash
cd backend
npm run test                 # Run tests once
npm run test:watch          # Run in watch mode
npm run test:coverage       # Run with coverage report
npm run test:ci             # Run for CI (no watch)
```

### 3. E2E Tests (Playwright)

**Location**: `e2e/`

**Technologies**:
- Playwright for browser automation
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile viewport testing

**What we test**:
- Complete user workflows
- Cross-browser compatibility
- API integration
- Real database interactions
- Performance and accessibility

**Example**:
```bash
npm run e2e                  # Run all E2E tests
npm run e2e:ui              # Run with UI interface
npm run e2e:headed          # Run with visible browser
npm run e2e:debug           # Run in debug mode
```

## Quick Start

### Run All Tests
```bash
# Complete test suite (unit + E2E)
./scripts/test-all.sh

# Frontend tests only
./scripts/test-all.sh --frontend-only

# Backend tests only
./scripts/test-all.sh --backend-only

# E2E tests only
./scripts/test-all.sh --e2e-only
```

### Development Testing
```bash
# Quick tests for development
./scripts/test-dev.sh quick

# Watch mode for frontend
./scripts/test-dev.sh frontend

# Watch mode for backend
./scripts/test-dev.sh backend

# Type checking
./scripts/test-dev.sh types

# Linting
./scripts/test-dev.sh lint
```

## Test Configuration

### Environment Variables

**Frontend** (`.env.test`):
```env
VITE_USE_MOCK_SERVICE=true
VITE_SKIP_AUTH=true
VITE_API_URL=http://localhost:3001
```

**Backend** (`.env.test`):
```env
NODE_ENV=test
USE_MOCK_DATA=true
SKIP_AUTH=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/drm_test_db
```

### Coverage Thresholds

**Frontend** (vite.config.ts):
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Backend** (jest.config.js):
- Statements: 85%
- Branches: 80%
- Functions: 85%
- Lines: 85%

## Mock Strategies

### Frontend Mocks
- Service layer mocking for API calls
- Component dependency injection
- Environment variable mocking
- Browser API mocking (localStorage, fetch, etc.)

### Backend Mocks
- Database connection mocking
- External service mocking (Redis, third-party APIs)
- Authentication middleware mocking
- File system operation mocking

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline automatically runs:

1. **Parallel Unit Tests**: Frontend and backend tests run simultaneously
2. **E2E Tests**: Full system testing with Docker services
3. **Coverage Collection**: Combined coverage reports
4. **Artifact Storage**: Test results and coverage reports

### Workflow Triggers
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

## Coverage Reports

### Viewing Coverage

**Frontend**:
```bash
cd frontend && npm run test:coverage
open coverage/index.html
```

**Backend**:
```bash
cd backend && npm run test:coverage
open coverage/lcov-report/index.html
```

**Combined**:
```bash
./scripts/test-all.sh
open coverage/frontend/index.html
open coverage/backend/lcov-report/index.html
```

### Coverage Integration
- Codecov integration for pull requests
- Coverage badges in README
- Failed builds on coverage regression

## Testing Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Reset mocks between tests
- Use specific mocks for specific scenarios
- Avoid over-mocking (test real logic when possible)

### 3. Test Data
- Use factories for test data generation
- Keep test data minimal and focused
- Clean up test data in teardown

### 4. Assertions
- Use specific, meaningful assertions
- Test behavior, not implementation
- Include negative test cases

### 5. Performance
- Keep tests fast and isolated
- Use test.only() and test.skip() during development
- Parallelize tests when possible

## Debugging Tests

### Frontend (Vitest)
```bash
# Debug specific test
npm run test -- --reporter=verbose path/to/test.ts

# Debug with browser dev tools
npm run test:ui

# Run single test file
npm run test path/to/specific.test.ts
```

### Backend (Jest)
```bash
# Debug with Node inspector
npm run test:watch -- --inspect-brk

# Run specific test
npm run test -- --testNamePattern="specific test name"

# Verbose output
npm run test -- --verbose
```

### E2E (Playwright)
```bash
# Debug mode (step through tests)
npm run e2e:debug

# Headed mode (see browser)
npm run e2e:headed

# Specific test file
npx playwright test e2e/daily-report.spec.ts

# Record new tests
npx playwright codegen localhost:3000
```

## Common Issues and Solutions

### 1. Test Timeouts
- Increase timeout in configuration
- Check for infinite loops or hanging promises
- Use proper waitFor() patterns

### 2. Flaky Tests
- Add proper wait conditions
- Use deterministic test data
- Avoid time-dependent assertions

### 3. Mock Issues
- Ensure mocks are properly reset
- Check mock implementation matches real API
- Verify mock setup in beforeEach/afterEach

### 4. Environment Issues
- Verify environment variables are set
- Check Docker services are running (for E2E)
- Ensure proper test isolation

## Performance Monitoring

### Test Execution Times
- Monitor test suite duration in CI
- Identify slow tests and optimize
- Use test parallelization effectively

### Coverage Trends
- Track coverage percentage over time
- Identify untested code paths
- Set coverage requirements for new code

## Future Enhancements

### Planned Improvements
- Visual regression testing with Percy/Chromatic
- Performance testing with Lighthouse CI
- Contract testing with Pact
- Mutation testing for test quality
- Automated test generation with AI tools

### Infrastructure
- Test result analytics dashboard
- Automated test maintenance
- Smart test selection based on code changes
- Performance benchmarking integration