jest.mock('../../config/logger');

const { log } = require('../../config/logger');
const { timeoutMiddleware } = require('../../middleware/timeout');

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  log.mockResolvedValue();
});

afterEach(() => {
  jest.useRealTimers();
});

const mockReqRes = (headersSent = false) => {
  const listeners = {};
  const req = {};
  const res = {
    headersSent,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    on: jest.fn((event, cb) => { listeners[event] = cb; }),
  };
  const next = jest.fn();
  return { req, res, next, listeners };
};

// ─────────────────────────────────────────
describe('timeoutMiddleware', () => {

  test('✅ Appelle next() immédiatement', () => {
    const { req, res, next } = mockReqRes();

    timeoutMiddleware(5000)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('✅ S\'abonne aux événements finish et close', () => {
    const { req, res, next } = mockReqRes();

    timeoutMiddleware(5000)(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  test('❌ Répond 503 si le délai expire et headers non envoyés', async () => {
    const { req, res, next } = mockReqRes(false);

    timeoutMiddleware(5000)(req, res, next);
    jest.runAllTimers();

    // Laisser les promesses se résoudre
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ message: 'Request timeout' });
    expect(log).toHaveBeenCalledWith('warn', undefined, undefined, null, {});
  });

  test('✅ Ne répond pas si les headers sont déjà envoyés', async () => {
    const { req, res, next } = mockReqRes(true);

    timeoutMiddleware(5000)(req, res, next);
    jest.runAllTimers();

    await Promise.resolve();

    expect(res.status).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  test('✅ Le timer est annulé sur l\'événement finish', async () => {
    const { req, res, next, listeners } = mockReqRes(false);

    timeoutMiddleware(5000)(req, res, next);

    // Simuler fin de réponse avant le timeout
    listeners['finish']();
    jest.runAllTimers();

    await Promise.resolve();

    expect(res.status).not.toHaveBeenCalled();
  });

  test('✅ Le timer est annulé sur l\'événement close', async () => {
    const { req, res, next, listeners } = mockReqRes(false);

    timeoutMiddleware(5000)(req, res, next);

    // Simuler fermeture de connexion avant le timeout
    listeners['close']();
    jest.runAllTimers();

    await Promise.resolve();

    expect(res.status).not.toHaveBeenCalled();
  });

  test('✅ Utilise 30 000 ms par défaut', () => {
    const { req, res, next } = mockReqRes(false);
    jest.spyOn(global, 'setTimeout');

    timeoutMiddleware()(req, res, next);

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 30_000);
  });

});
