// Désactive le rate limiter pour éviter les 429 lors des tests d'intégration.
// rateLimiter.test.js teste le vrai comportement avec jest.resetModules().
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const request = require("supertest");
const app = require("../../app");
const prisma = require("../../config/prisma");

const { cleanDB, disconnectDB } = require('../helpers/setupPrisma');

beforeAll(async () => {
  await prisma.users.deleteMany({ where: { email: "test@jest.com" } });
});

beforeEach(async () => await cleanDB());
afterAll(async () => {
  await prisma.users.deleteMany({ where: { email: "test@jest.com" } });
  await disconnectDB();
});

describe("POST /auth/register", () => {
  test("✅ Inscription réussie", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@jest.com",
      password: "monpassword123",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("test@jest.com");
  });

  test("❌ Email invalide", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "pasunmail",
      password: "monpassword123",
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe("email");
  });

  test("❌ Mot de passe trop court", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@jest.com",
      password: "court",
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe("password");
  });

  test("❌ Email déjà utilisé", async () => {
    // register une 1ère fois
    await request(app)
      .post("/auth/register")
      .send({ email: "test@jest.com", password: "monpassword123" });

    // register une 2ème fois avec le même email
    const response = await request(app)
      .post("/auth/register")
      .send({ email: "test@jest.com", password: "monpassword123" });

    expect(response.status).toBe(409);
  });

  test("❌ Email manquant", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ password: "monpassword123" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("email");
  });

  test("❌ Mot de passe manquant", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test2@jest.com" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("password");
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send({
      email: "test@jest.com",
      password: "monpassword123",
    });
  });

  test("✅ Connexion réussie", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@jest.com",
      password: "monpassword123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("❌ Identifiants invalides", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@jest.com",
      password: "mauvaispassword123",
    });

    expect(response.status).toBe(401);
  });

  test("❌ Email inexistant", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "inexistant@jest.com", password: "monpassword123" });

    expect(response.status).toBe(401);
  });

  test("✅ Token JWT valide (format)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@jest.com", password: "monpassword123" });

    expect(res.status).toBe(200);
    const parts = res.body.token.split(".");
    expect(parts).toHaveLength(3); // header.payload.signature
  });
});

describe("POST /auth/refresh", () => {
  let refreshCookie;
  beforeEach(async () => {
    await request(app).post("/auth/register").send({
      email: "test@jest.com",
      password: "monpassword123",
    });
    const res = await request(app).post("/auth/login").send({
      email: "test@jest.com",
      password: "monpassword123",
    });

    if (res.status !== 200) throw new Error(`Login échoué avec status ${res.status}`);
    const setCookie = res.headers["set-cookie"] ?? [];
    refreshCookie = setCookie.find((c) => c.startsWith("refreshToken="));
    if (!refreshCookie) throw new Error("Cookie refreshToken absent de la réponse");
  });

  test("✅ Rafraîchissement réussi → retourne un nouveau token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("✅ Nouveau token JWT valide (format header.payload.signature)", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(res.status).toBe(200);
    const parts = res.body.token.split(".");
    expect(parts).toHaveLength(3);
  });

  test("❌ Sans cookie → 401 Refresh token manquant", async () => {
    const res = await request(app).post("/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Refresh token manquant");
  });

  test("❌ Cookie avec token JWT invalide → 401 Refresh token invalide ou expiré", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", "refreshToken=cecinestpasuntoken");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Refresh token invalide ou expiré");
  });

  test("❌ Cookie avec token JWT valide mais révoqué → 401", async () => {
    // Créer un JWT syntaxiquement valide mais absent de la BDD
    const jwt = require("jsonwebtoken");
    const fakeToken = jwt.sign(
      { userId: 999 },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", `refreshToken=${fakeToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Refresh token révoqué");
  });
});