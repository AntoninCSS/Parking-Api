jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../config/prisma', () => ({
  users: {
    findUnique: jest.fn(),
    create:     jest.fn(),
  },
  refresh_tokens: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
}));
jest.mock('../../config/logger');

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { log } = require('../../config/logger');
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} = require('../../services/authService');

beforeEach(() => {
  jest.clearAllMocks();
  log.mockResolvedValue();
  process.env.JWT_SECRET         = 'test_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
});

// ─────────────────────────────────────────
describe('registerUser', () => {

  test('❌ Email manquant → statusCode 400', async () => {
    await expect(registerUser('', 'monpassword123'))
      .rejects.toMatchObject({ statusCode: 400, message: 'Email et mot de passe requis' });
  });

  test('❌ Mot de passe trop court → statusCode 400', async () => {
    await expect(registerUser('test@jest.com', 'court'))
      .rejects.toMatchObject({ statusCode: 400, message: 'Mot de passe trop court (12 caractères minimum)' });
  });

  test('❌ Email déjà utilisé → statusCode 409', async () => {
    prisma.users.findUnique.mockResolvedValueOnce({ id: 1 });

    await expect(registerUser('existant@jest.com', 'monpassword123'))
      .rejects.toMatchObject({ statusCode: 409, message: 'Email déjà utilisé' });
  });

  test('✅ Inscription réussie → retourne token + user', async () => {
    prisma.users.findUnique.mockResolvedValueOnce(null);
    prisma.users.create.mockResolvedValueOnce({ id: 1, email: 'test@jest.com', role: 'user' });
    bcrypt.hash.mockResolvedValue('fakehashedpassword');
    jwt.sign.mockReturnValue('faketoken');

    const result = await registerUser('test@jest.com', 'monpassword123');

    expect(result).toEqual({
      token: 'faketoken',
      user: { id: 1, email: 'test@jest.com' },
    });
  });

  test('❌ Erreur BDD inattendue → throw', async () => {
    prisma.users.findUnique.mockRejectedValueOnce(new Error('DB crash'));

    await expect(registerUser('test@jest.com', 'monpassword123'))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('loginUser', () => {

  test('❌ Password manquant → statusCode 400', async () => {
    await expect(loginUser('test@jest.com', ''))
      .rejects.toMatchObject({ statusCode: 400, message: 'Email et mot de passe requis' });
  });

  test('❌ Email inexistant → statusCode 401', async () => {
    prisma.users.findUnique.mockResolvedValueOnce(null);

    await expect(loginUser('inexistant@jest.com', 'monpassword123'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Identifiants invalides' });
  });

  test('❌ Mauvais mot de passe → statusCode 401', async () => {
    prisma.users.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@jest.com', password_hash: 'hash', role: 'user' });
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginUser('test@jest.com', 'mauvaispassword'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Identifiants invalides' });
  });

  test('✅ Connexion réussie → retourne token, refreshToken + user', async () => {
    prisma.users.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@jest.com', password_hash: 'hash', role: 'user' });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign
      .mockReturnValueOnce('fakeaccesstoken')
      .mockReturnValueOnce('fakerefreshtoken');
    prisma.refresh_tokens.create.mockResolvedValueOnce({});

    const result = await loginUser('test@jest.com', 'monpassword123');

    expect(prisma.refresh_tokens.create).toHaveBeenCalledWith({
      data: { user_id: 1, token: 'fakerefreshtoken' },
    });
    expect(result).toEqual({
      accessToken: 'fakeaccesstoken',
      refreshToken: 'fakerefreshtoken',
      user: { id: 1, email: 'test@jest.com' },
    });
  });

  test('❌ Erreur BDD inattendue → throw', async () => {
    prisma.users.findUnique.mockRejectedValueOnce(new Error('DB crash'));

    await expect(loginUser('test@jest.com', 'monpassword123'))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('refreshAccessToken', () => {

  test('❌ Token manquant → statusCode 401', async () => {
    await expect(refreshAccessToken(undefined))
      .rejects.toMatchObject({ statusCode: 401, message: 'Refresh token manquant' });
  });

  test('❌ Token JWT invalide ou expiré → statusCode 401', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    await expect(refreshAccessToken('badtoken'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Refresh token invalide ou expiré' });
  });

  test('❌ Token révoqué (absent en BDD) → statusCode 401', async () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    prisma.refresh_tokens.findUnique.mockResolvedValueOnce(null);

    await expect(refreshAccessToken('revokedtoken'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Refresh token révoqué' });
  });

  test('✅ Token valide → retourne un nouvel accessToken', async () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    prisma.refresh_tokens.findUnique.mockResolvedValueOnce({ id: 1, token: 'validtoken', user_id: 1 });
    prisma.users.findUnique.mockResolvedValueOnce({ id: 1, role: 'user' });
    jwt.sign.mockReturnValue('newaccesstoken');

    const result = await refreshAccessToken('validtoken');

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_refresh_secret');
    expect(prisma.refresh_tokens.findUnique).toHaveBeenCalledWith({
      where: { token: 'validtoken' },
    });
    expect(result).toEqual({ accessToken: 'newaccesstoken' });
  });

  test('❌ Erreur BDD inattendue → throw', async () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    prisma.refresh_tokens.findUnique.mockRejectedValueOnce(new Error('DB crash'));

    await expect(refreshAccessToken('sometoken'))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('logoutUser', () => {

  test('✅ Sans token → ne supprime rien en BDD', async () => {
    await logoutUser(undefined, null);

    expect(prisma.refresh_tokens.deleteMany).not.toHaveBeenCalled();
  });

  test('✅ Avec token → supprime le token en BDD', async () => {
    prisma.refresh_tokens.deleteMany.mockResolvedValueOnce({ count: 1 });

    await logoutUser('somerefreshtoken', 1);

    expect(prisma.refresh_tokens.deleteMany).toHaveBeenCalledWith({
      where: { token: 'somerefreshtoken' },
    });
    expect(log).toHaveBeenCalledWith('info', expect.any(String), expect.any(String), 1, {});
  });

  test('✅ Sans userId → log avec null', async () => {
    prisma.refresh_tokens.deleteMany.mockResolvedValueOnce({ count: 1 });

    await logoutUser('sometoken', undefined);

    expect(log).toHaveBeenCalledWith('info', expect.any(String), expect.any(String), null, {});
  });

});
