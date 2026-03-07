jest.mock('jsonwebtoken');
jest.mock('../../config/logger');

const jwt = require('jsonwebtoken');
const { log } = require('../../config/logger');
const { authenticate, requireRole } = require('../../middleware/authMiddleware');

beforeEach(() => {
  jest.clearAllMocks();
  log.mockResolvedValue();
  process.env.JWT_SECRET = 'test_secret';
});

// Helper pour créer de faux objets req/res/next
const mockReqRes = (headers = {}, user = null) => {
  const req = { headers, user, originalUrl: '/test' };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

// ─────────────────────────────────────────
describe('authenticate', () => {

  test('✅ Token valide → appelle next() et attache req.user', async () => {
    const { req, res, next } = mockReqRes({ authorization: 'Bearer validtoken' });
    const decoded = { userId: 1, role: 'user' };
    jwt.verify.mockReturnValue(decoded);

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_secret');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('❌ Pas de token → 401', async () => {
    const { req, res, next } = mockReqRes({});

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token manquant' });
    expect(next).not.toHaveBeenCalled();
  });

  test('❌ Header Authorization sans "Bearer" → 401', async () => {
    const { req, res, next } = mockReqRes({ authorization: 'Basic sometoken' });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('❌ Token invalide → 403', async () => {
    const { req, res, next } = mockReqRes({ authorization: 'Bearer badtoken' });
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide ou expiré' });
    expect(next).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────
describe('requireRole', () => {

  test('✅ Rôle correct → appelle next()', async () => {
    const { req, res, next } = mockReqRes({}, { userId: 1, role: 'admin' });

    await requireRole('admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('❌ Rôle insuffisant → 403', async () => {
    const { req, res, next } = mockReqRes({}, { userId: 2, role: 'user' });

    await requireRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès interdit' });
    expect(next).not.toHaveBeenCalled();
  });

});
