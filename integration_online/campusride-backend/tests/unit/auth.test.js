import { authenticateToken } from '../../src/middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid JWT token', asyncTest(async () => {
      const token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      // Mock Supabase response
      const { supabaseAdmin } = await import('../../src/config/database.js');
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          is_active: true
        },
        error: null
      });

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        is_active: true
      });
    }));

    test('should reject missing authorization header', asyncTest(async () => {
      req.headers.authorization = undefined;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Access token required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    }));

    test('should reject invalid JWT token', asyncTest(async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    }));

    test('should reject token for inactive user', asyncTest(async () => {
      const token = jwt.sign({ userId: 'inactive-user' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      // Mock Supabase response for inactive user
      const { supabaseAdmin } = await import('../../src/config/database.js');
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'inactive-user',
          email: 'inactive@example.com',
          is_active: false
        },
        error: null
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    }));
  });
}); 