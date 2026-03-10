jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../config/prisma', () => ({
  users: {
    findUnique: jest.fn(),
    create:     jest.fn(),
  },
}));
jest.mock('../../config/logger');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const { log } = require('../../config/logger');
const { registerUser, loginUser } = require('../../services/authService');

beforeEach(() => {
  jest.clearAllMocks();
  log.mockResolvedValue();
  process.env.JWT_SECRET = 'test_secret';
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

  test('✅ Connexion réussie → retourne token + user', async () => {
    prisma.users.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@jest.com', password_hash: 'hash', role: 'user' });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('faketoken');

    const result = await loginUser('test@jest.com', 'monpassword123');

    expect(result).toEqual({
      token: 'faketoken',
      user: { id: 1, email: 'test@jest.com' },
    });
  });

  test('❌ Erreur BDD inattendue → throw', async () => {
    prisma.users.findUnique.mockRejectedValueOnce(new Error('DB crash'));

    await expect(loginUser('test@jest.com', 'monpassword123'))
      .rejects.toThrow('DB crash');
  });

});
