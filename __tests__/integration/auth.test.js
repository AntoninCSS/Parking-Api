const request = require("supertest");
const app = require("../../app");
const con = require("../../config/db");

beforeAll(async () => {
  await con.query("DELETE FROM users WHERE email = 'test@jest.com'");
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

afterAll(async () => {
  await con.query("DELETE FROM users WHERE email = 'test@jest.com'");
});
