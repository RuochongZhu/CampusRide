# CI/CD Testing Module

This directory contains integration and end-to-end tests for the CampusRide application.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run end-to-end tests only
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `tests/integration/` - Integration tests for API endpoints
- `tests/e2e/` - End-to-end workflow tests
- `tests/fixtures/` - Test data and mocks

## GitHub Actions

This module is automatically tested on every push to main/develop branches. Check the Actions tab in GitHub to see test results.

## Adding New Tests

1. Create test files in the appropriate directory
2. Follow the existing naming convention: `*.test.js`
3. Use the setup file for common test configuration

## Environment Variables

Test environment variables are defined in `.env.test`. The CI system uses these for automated testing.