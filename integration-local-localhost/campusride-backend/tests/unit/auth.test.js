import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const single = jest.fn();
const eq = jest.fn(() => ({ single }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));

jest.unstable_mockModule('../../src/config/database.js', () => ({
  supabaseAdmin: {
    from
  }
}));

const { authenticateToken } = await import('../../src/middleware/auth.middleware.js');

const createRequest = (overrides = {}) => ({
  headers: {},
  ...overrides
});

describe('authenticateToken', () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    eq.mockClear();
    single.mockReset();
  });

  test('accepts a valid token for a verified user', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ userId: 'user-1' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = createRequest({
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const res = {};
    const next = jest.fn();

    single.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        verification_status: 'verified',
        is_verified: true
      },
      error: null
    });

    await authenticateToken(req, res, next);

    expect(req.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      verification_status: 'verified',
      is_verified: true
    });
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects missing authorization headers', async () => {
    const req = createRequest();
    const res = {};
    const next = jest.fn();

    await authenticateToken(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Access token required');
    expect(error.statusCode).toBe(401);
  });

  test('rejects invalid jwt tokens', async () => {
    const req = createRequest({
      headers: {
        authorization: 'Bearer invalid-token'
      }
    });
    const res = {};
    const next = jest.fn();

    await authenticateToken(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Invalid token');
    expect(error.statusCode).toBe(401);
  });

  test('rejects unverified users', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ userId: 'user-2' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = createRequest({
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const res = {};
    const next = jest.fn();

    single.mockResolvedValue({
      data: {
        id: 'user-2',
        email: 'pending@example.com',
        verification_status: 'pending',
        is_verified: false
      },
      error: null
    });

    await authenticateToken(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Account is not verified');
    expect(error.statusCode).toBe(401);
  });
});
