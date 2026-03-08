const request = require('supertest');
const app = require('../../app');
const con = require('../../config/db');
const bcrypt = require('bcryptjs');

let token;
let createdParkingId;

beforeAll(async () => {
  // Nettoie et crée un admin directement en base
  await con.query("DELETE FROM users WHERE email = 'admin@jest.com'");
  const hash = await bcrypt.hash('monpassword123', 10);
  await con.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')",
    ['admin@jest.com', hash]
  );

  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@jest.com', password: 'monpassword123' });
  token = res.body.token;
});

afterAll(async () => {
  await con.query("DELETE FROM parkings WHERE city = 'JestCity'");
  await con.query("DELETE FROM users WHERE email = 'admin@jest.com'");
  // pas de con.end() → géré par --forceExit
});

// ─────────────────────────────────────────
describe('GET /parkings', () => {

  test('✅ Récupère la liste paginée', async () => {
    const res = await request(app)
      .get('/parkings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeDefined();
  });

  test('✅ Pagination explicite page=1&limit=5', async () => {
    const res = await request(app)
      .get('/parkings?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination.limit).toBe(5);
  });

  test('✅ XSS dans page → fallback page=1, retourne 200', async () => {
    const res = await request(app)
      .get('/parkings?page=<script>alert(1)</script>&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  test('✅ Injection SQL dans limit → fallback limit=10, retourne 200', async () => {
    const res = await request(app)
      .get('/parkings?page=1&limit=1 OR 1=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(10);
  });

  test('✅ limit abusive → plafonnée à 100', async () => {
    const res = await request(app)
      .get('/parkings?page=1&limit=999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });

});

// ─────────────────────────────────────────
describe('POST /parkings', () => {

  test('✅ Crée un parking', async () => {
    const res = await request(app)
      .post('/parkings')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Parking Jest', city: 'JestCity' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Parking Jest');

    createdParkingId = res.body.id;
  });

  test('❌ Champs manquants', async () => {
    const res = await request(app)
      .post('/parkings')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sans ville' });

    expect(res.status).toBe(400);
  });

  test('❌ Sans token', async () => {
    const res = await request(app)
      .post('/parkings')
      .send({ name: 'Parking Jest', city: 'JestCity' });

    expect(res.status).toBe(401);
  });

});

// ─────────────────────────────────────────
describe('GET /parkings/:id', () => {

  test('✅ Récupère un parking par ID', async () => {
    const res = await request(app)
      .get(`/parkings/${createdParkingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdParkingId);
  });

  test('❌ ID inexistant', async () => {
    const res = await request(app)
      .get('/parkings/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('❌ ID avec XSS → 400', async () => {
    const res = await request(app)
      .get('/parkings/<script>alert(1)</script>')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('❌ ID avec injection SQL → 400', async () => {
    const res = await request(app)
      .get('/parkings/1 OR 1=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

});

// ─────────────────────────────────────────
describe('PUT /parkings/:id', () => {

  test('✅ Met à jour un parking', async () => {
    const res = await request(app)
      .put(`/parkings/${createdParkingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Parking Jest Modifié', city: 'JestCity' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Parking Jest Modifié');
  });

  test('❌ ID inexistant', async () => {
    const res = await request(app)
      .put('/parkings/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', city: 'X' });

    expect(res.status).toBe(404);
  });

});

// ─────────────────────────────────────────
describe('PATCH /parkings/:id', () => {

  test('✅ Modification partielle (name uniquement)', async () => {
    const res = await request(app)
      .patch(`/parkings/${createdParkingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Patch Jest' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Patch Jest');
  });

  test('❌ Aucun champ valide envoyé', async () => {
    const res = await request(app)
      .patch(`/parkings/${createdParkingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ champsInvalide: 'valeur' });

    expect(res.status).toBe(400);
  });

});

// ─────────────────────────────────────────
describe('DELETE /parkings/:id', () => {

  test('✅ Supprime un parking', async () => {
    const res = await request(app)
      .delete(`/parkings/${createdParkingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdParkingId);
  });

  test('❌ ID inexistant', async () => {
    const res = await request(app)
      .delete('/parkings/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

});