const request = require('supertest');
const app = require('../../app');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
let userToken;
let adminToken;
let testParkingId;
let createdReservationId;


beforeAll(async () => {
  // Crée un user standard
  await prisma.users.deleteMany({ where: { email: 'user@jest.com' } });
  const userHash = await bcrypt.hash('monpassword123', 10);
  await prisma.users.create({
    data: { email: 'user@jest.com', password_hash: userHash, role: 'user' },
  });
  const userRes = await request(app)
    .post('/auth/login')
    .send({ email: 'user@jest.com', password: 'monpassword123' });
  userToken = userRes.body.token;

  // Crée un admin
  await prisma.users.deleteMany({ where: { email: 'admin@jest.com' } });
  const adminHash = await bcrypt.hash('monpassword123', 10);
  await prisma.users.create({
    data: { email: 'admin@jest.com', password_hash: adminHash, role: 'admin' },
  });
  const adminRes = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@jest.com', password: 'monpassword123' });
  adminToken = adminRes.body.token;

  // Crée un parking de test
  const parking = await prisma.parkings.create({
    data: { name: 'Parking Jest', city: 'JestCityReservation' },
  });
  testParkingId = parking.id;
});

afterAll(async () => {
  // La suppression du parking cascade sur les réservations (onDelete: Cascade)
  await prisma.parkings.deleteMany({ where: { id: testParkingId } });
  await prisma.users.deleteMany({
    where: { email: { in: ['user@jest.com', 'admin@jest.com'] } },
  });
});

// ─────────────────────────────────────────
describe('GET /parkings/:id/reservations', () => {

  test('✅ Récupère la liste paginée (sans auth)', async () => {
    const res = await request(app)
      .get(`/parkings/${testParkingId}/reservations`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  test('✅ Pagination explicite page=1&limit=5', async () => {
    const res = await request(app)
      .get(`/parkings/${testParkingId}/reservations?page=1&limit=5`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination.limit).toBe(5);
  });

  test('✅ XSS dans page → fallback page=1, retourne 200', async () => {
    const res = await request(app)
      .get(`/parkings/${testParkingId}/reservations?page=<script>alert(1)</script>&limit=5`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  test('✅ limit abusive → plafonnée à 100', async () => {
    const res = await request(app)
      .get(`/parkings/${testParkingId}/reservations?page=1&limit=999999`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });

  test('❌ parkingId avec XSS → 400', async () => {
    const res = await request(app)
      .get('/parkings/<script>alert(1)</script>/reservations');

    expect(res.status).toBe(404);
  });

});

// ─────────────────────────────────────────
describe('POST /parkings/:id/reservations', () => {

  test('✅ Crée une réservation', async () => {
    const res = await request(app)
      .post(`/parkings/${testParkingId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        client_name: 'Jean Jest',
        vehicle: 'Voiture',
        license_plate: 'AB-123-CD',
        checkin: '10/06/2026',
        checkout: '12/06/2026'
      });

    expect(res.status).toBe(201);
    expect(res.body[0].id).toBeDefined();
    expect(res.body[0].client_name).toBe('Jean Jest');

    createdReservationId = res.body[0].id;
  });

  test('❌ Sans token', async () => {
    const res = await request(app)
      .post(`/parkings/${testParkingId}/reservations`)
      .send({
        client_name: 'Jean Jest',
        vehicle: 'Voiture',
        license_plate: 'AB-123-CD',
        checkin: '10/06/2026',
        checkout: '12/06/2026'
      });

    expect(res.status).toBe(401);
  });

  test('❌ Champs manquants', async () => {
    const res = await request(app)
      .post(`/parkings/${testParkingId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ client_name: 'Jean Jest' });

    expect(res.status).toBe(400);
  });

  test('❌ Check-in après check-out', async () => {
    const res = await request(app)
      .post(`/parkings/${testParkingId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        client_name: 'Jean Jest',
        vehicle: 'Voiture',
        license_plate: 'AB-123-CD',
        checkin: '15/06/2026',
        checkout: '10/06/2026'
      });

    expect(res.status).toBe(400);
  });

});

// ─────────────────────────────────────────
describe('GET /parkings/:id/reservations/:reservationId', () => {

  test('✅ Récupère une réservation par ID', async () => {
    const res = await request(app)
      .get(`/parkings/${testParkingId}/reservations/${createdReservationId}`);

    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(createdReservationId);
  });

  test('❌ ID inexistant', async () => {
    const res = await request(app)
      .get(`/parkings/${testParkingId}/reservations/999999`);

    expect(res.status).toBe(404);
  });

});

// ─────────────────────────────────────────
describe('PUT /parkings/:id/reservations/:reservationId', () => {

  test('✅ Met à jour une réservation', async () => {
    const res = await request(app)
      .put(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        client_name: 'Jean Jest Modifié',
        vehicle: 'Moto',
        license_plate: 'XY-999-ZZ',
        checkin: '10/06/2026',
        checkout: '13/06/2026'
      });

    expect(res.status).toBe(200);
    expect(res.body[0].client_name).toBe('Jean Jest Modifié');
  });

  test('❌ Champs manquants', async () => {
    const res = await request(app)
      .put(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ client_name: 'Seulement le nom' });

    expect(res.status).toBe(400);
  });

  test('❌ ID inexistant', async () => {
    const res = await request(app)
      .put(`/parkings/${testParkingId}/reservations/999999`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        client_name: 'Jean Jest Modifié',
        vehicle: 'Moto',
        license_plate: 'XY-999-ZZ',
        checkin: '10/06/2026',
        checkout: '11/06/2026'
      });

    expect(res.status).toBe(404);
  });

});

// ─────────────────────────────────────────
describe('PATCH /parkings/:id/reservations/:reservationId', () => {

  test('✅ Modification partielle (client_name uniquement)', async () => {
    const res = await request(app)
      .patch(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ client_name: 'Patch Jest' });

    expect(res.status).toBe(200);
    expect(res.body.client_name).toBe('Patch Jest');
  });

  test('❌ Aucun champ valide envoyé', async () => {
    const res = await request(app)
      .patch(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ champsInvalide: 'valeur' });

    expect(res.status).toBe(400);
  });

  test('❌ Sans token', async () => {
    const res = await request(app)
      .patch(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .send({ client_name: 'Sans auth' });

    expect(res.status).toBe(401);
  });

});

// ─────────────────────────────────────────
describe('DELETE /parkings/:id/reservations/:reservationId', () => {

  test('❌ User standard ne peut pas supprimer (403)', async () => {
    const res = await request(app)
      .delete(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test('❌ Sans token', async () => {
    const res = await request(app)
      .delete(`/parkings/${testParkingId}/reservations/${createdReservationId}`);

    expect(res.status).toBe(401);
  });

  test('✅ Admin supprime une réservation', async () => {
    const res = await request(app)
      .delete(`/parkings/${testParkingId}/reservations/${createdReservationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('❌ ID inexistant', async () => {
    const res = await request(app)
      .delete(`/parkings/${testParkingId}/reservations/999999`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

});
