jest.mock('../../config/prisma', () => ({
  reservations: {
    count:     jest.fn(),
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
}));
jest.mock('../../config/logger');

const prisma = require('../../config/prisma');
const { log } = require('../../config/logger');
const {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  updatePartialReservation,
} = require('../../services/reservationService');

beforeEach(() => {
  jest.clearAllMocks();
  log.mockResolvedValue();
});

const fakeReservation = {
  id: 1,
  parking_id: 10,
  client_name: 'Jean Jest',
  vehicle: 'Voiture',
  license_plate: 'AB-123-CD',
  checkin: '2026-06-10T00:00:00.000Z',
  checkout: '2026-06-12T00:00:00.000Z',
};

// ─────────────────────────────────────────
describe('getAllReservations', () => {

  test('✅ Retourne la liste paginée', async () => {
    prisma.reservations.count.mockResolvedValueOnce(3);
    prisma.reservations.findMany.mockResolvedValueOnce([fakeReservation]);

    const result = await getAllReservations(10, { page: 1, limit: 10, offset: 0 });

    expect(result.data).toEqual([fakeReservation]);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.page).toBe(1);
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.reservations.count.mockRejectedValueOnce(new Error('DB crash'));

    await expect(getAllReservations(10, { page: 1, limit: 10, offset: 0 }))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('getReservationById', () => {

  test('✅ Retourne une réservation', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);

    const result = await getReservationById(10, 1);
    expect(result).toEqual([fakeReservation]);
  });

  test('❌ ID inexistant → statusCode 404', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(null);

    await expect(getReservationById(10, 999))
      .rejects.toMatchObject({ statusCode: 404, message: 'Réservation introuvable' });
  });

});

// ─────────────────────────────────────────
describe('createReservation', () => {

  const validBody = {
    client_name: 'Jean Jest',
    vehicle: 'Voiture',
    license_plate: 'AB-123-CD',
    checkin: '10/06/2026',
    checkout: '12/06/2026',
  };

  test('✅ Crée une réservation', async () => {
    prisma.reservations.create.mockResolvedValueOnce(fakeReservation);

    const result = await createReservation(10, validBody, 1);
    expect(result).toEqual([fakeReservation]);
  });

  test('❌ Check-in après check-out → statusCode 400', async () => {
    const body = { ...validBody, checkin: '15/06/2026', checkout: '10/06/2026' };

    await expect(createReservation(10, body, 1))
      .rejects.toMatchObject({ statusCode: 400, message: 'La date de check-in doit être avant la date de check-out' });
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.reservations.create.mockRejectedValueOnce(new Error('DB crash'));

    await expect(createReservation(10, validBody, 1))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('updateReservation', () => {

  const validBody = {
    client_name: 'Jean Jest Modifié',
    vehicle: 'Moto',
    license_plate: 'XY-999-ZZ',
    checkin: '10/06/2026',
    checkout: '13/06/2026',
  };

  test('✅ Met à jour une réservation', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    prisma.reservations.update.mockResolvedValueOnce({ ...fakeReservation, client_name: 'Jean Jest Modifié' });

    const result = await updateReservation(10, 1, validBody, 1);
    expect(result[0].client_name).toBe('Jean Jest Modifié');
  });

  test('❌ Champs manquants → statusCode 400', async () => {
    await expect(updateReservation(10, 1, { client_name: 'Seulement le nom' }, 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('❌ Check-in après check-out → statusCode 400', async () => {
    const body = { ...validBody, checkin: '15/06/2026', checkout: '10/06/2026' };

    await expect(updateReservation(10, 1, body, 1))
      .rejects.toMatchObject({ statusCode: 400, message: 'La date de check-in doit être avant la date de check-out' });
  });

  test('❌ ID inexistant → statusCode 404', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(null);

    await expect(updateReservation(10, 999, validBody, 1))
      .rejects.toMatchObject({ statusCode: 404, message: 'Réservation introuvable' });
  });

});

// ─────────────────────────────────────────
describe('deleteReservation', () => {

  test('✅ Supprime une réservation', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    prisma.reservations.delete.mockResolvedValueOnce(fakeReservation);

    const result = await deleteReservation(10, 1, 1);
    expect(result).toEqual([fakeReservation]);
  });

  test('❌ ID inexistant → statusCode 404', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(null);

    await expect(deleteReservation(10, 999, 1))
      .rejects.toMatchObject({ statusCode: 404, message: 'Réservation introuvable' });
  });

});

// ─────────────────────────────────────────
describe('updatePartialReservation', () => {

  test('✅ Modification partielle (client_name)', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    prisma.reservations.update.mockResolvedValueOnce({ ...fakeReservation, client_name: 'Patch Jest' });

    const result = await updatePartialReservation(10, 1, { client_name: 'Patch Jest' }, 1);
    expect(result.client_name).toBe('Patch Jest');
  });

  test('❌ Aucun champ valide → statusCode 400', async () => {
    await expect(updatePartialReservation(10, 1, { champInvalide: 'valeur' }, 1))
      .rejects.toMatchObject({ statusCode: 400, message: 'Aucun champ à modifier' });
  });

  test('❌ ID inexistant → statusCode 404', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(null);

    await expect(updatePartialReservation(10, 999, { client_name: 'Patch' }, 1))
      .rejects.toMatchObject({ statusCode: 404, message: 'Réservation introuvable' });
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    prisma.reservations.update.mockRejectedValueOnce(new Error('DB crash'));

    await expect(updatePartialReservation(10, 1, { client_name: 'Patch' }, 1))
      .rejects.toThrow('DB crash');
  });

});
