import { describe, expect, test } from '@jest/globals';

const currentAuthModule = await import('../../src/middleware/auth.middleware.js');
const legacyAuthModule = await import('../../src/middlewares/auth.middleware.js');

describe('legacy auth middleware exports', () => {
  test('re-export the current authenticateToken implementation', () => {
    expect(legacyAuthModule.authenticateToken).toBe(currentAuthModule.authenticateToken);
    expect(legacyAuthModule.optionalAuth).toBe(currentAuthModule.optionalAuth);
  });

  test('preserve the default export for old route imports', () => {
    expect(legacyAuthModule.default).toBeDefined();
    expect(legacyAuthModule.default.authenticateToken).toBe(currentAuthModule.authenticateToken);
    expect(legacyAuthModule.default.optionalAuth).toBe(currentAuthModule.optionalAuth);
  });
});
