const { paginate } = require('../../middleware/pagination');

const mockReq = (query = {}) => ({ query });
const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('paginate middleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
  });

  // ─── Cas valides ───────────────────────────────────────────────────────────

  test('✅ page=2&limit=5 → pagination correcte', () => {
    const req = mockReq({ page: '2', limit: '5' });
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 2, limit: 5, offset: 5 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('✅ Paramètres absents → défauts page=1, limit=10, offset=0', () => {
    const req = mockReq({});
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
    expect(next).toHaveBeenCalled();
  });

  test('✅ Calcul offset correct (page=3, limit=10 → offset=20)', () => {
    const req = mockReq({ page: '3', limit: '10' });
    paginate(req, mockRes(), next);
    expect(req.pagination.offset).toBe(20);
  });

  test('✅ limit=100 → autorisé (MAX_LIMIT)', () => {
    const req = mockReq({ page: '1', limit: '100' });
    paginate(req, mockRes(), next);
    expect(req.pagination.limit).toBe(100);
  });

  // ─── Plafonnement ─────────────────────────────────────────────────────────

  test('✅ limit=999999 → plafonné à 100', () => {
    const req = mockReq({ page: '1', limit: '999999' });
    paginate(req, mockRes(), next);
    expect(req.pagination.limit).toBe(100);
    expect(next).toHaveBeenCalled();
  });

  test('✅ limit=101 → plafonné à 100', () => {
    const req = mockReq({ page: '1', limit: '101' });
    paginate(req, mockRes(), next);
    expect(req.pagination.limit).toBe(100);
  });

  // ─── Protection XSS ───────────────────────────────────────────────────────

  test('❌ XSS dans page → fallback page=1', () => {
    const req = mockReq({ page: '<script>alert(1)</script>', limit: '10' });
    paginate(req, mockRes(), next);
    expect(req.pagination.page).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  test('❌ XSS dans limit → fallback limit=10', () => {
    const req = mockReq({ page: '1', limit: '<img src=x onerror=alert(1)>' });
    paginate(req, mockRes(), next);
    expect(req.pagination.limit).toBe(10);
    expect(next).toHaveBeenCalled();
  });

  // ─── Protection injection ─────────────────────────────────────────────────

  test('❌ Injection SQL dans page → fallback page=1', () => {
    const req = mockReq({ page: '1 OR 1=1', limit: '10' });
    paginate(req, mockRes(), next);
    expect(req.pagination.page).toBe(1);
  });

  test('❌ Injection SQL dans limit → fallback limit=10', () => {
    const req = mockReq({ page: '1', limit: '1 OR 1=1' });
    paginate(req, mockRes(), next);
    expect(req.pagination.limit).toBe(10);
  });

  // ─── Valeurs invalides ────────────────────────────────────────────────────

  test('❌ Valeurs négatives → fallback', () => {
    const req = mockReq({ page: '-5', limit: '-10' });
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  test('❌ Zéro → fallback', () => {
    const req = mockReq({ page: '0', limit: '0' });
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  test('❌ Float → fallback', () => {
    const req = mockReq({ page: '1.5', limit: '2.9' });
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  test('❌ Chaîne alphanumérique → fallback', () => {
    const req = mockReq({ page: '1abc', limit: 'xyz' });
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  test('❌ Valeur undefined explicite → fallback', () => {
    const req = mockReq({ page: undefined, limit: undefined });
    paginate(req, mockRes(), next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
  });
});
