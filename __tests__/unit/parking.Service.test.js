jest.mock('../../config/prisma', () => ({
  parkings: {
    findMany:   jest.fn(),
    count:      jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  reservations: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}));
jest.mock('../../config/logger');

const prisma = require('../../config/prisma');
const { log } = require('../../config/logger');
const {
  getAllParkings,
  getParkingById,
  createParking,
  updateParking,
  deleteParking,
  updatePartialParking,
  checkAvailability,
} = require('../../services/parkingService');

beforeEach(() => {
  jest.resetAllMocks();
  log.mockResolvedValue();
});

const fakePark = { id: 1, name: 'Parking Jest', city: 'JestCity', capacity: 5 };

// ─────────────────────────────────────────
describe('getAllParkings', () => {

  test('✅ Retourne la liste paginée', async () => {
    prisma.$transaction.mockResolvedValueOnce([[fakePark], 2]);

    const result = await getAllParkings({ page: 1, limit: 10, offset: 0 });

    expect(result.data).toEqual([fakePark]);
    expect(result.pagination.total).toBe(2);
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('DB crash'));

    await expect(getAllParkings({ page: 1, limit: 10, offset: 0 }))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('getParkingById', () => {

  test('✅ Retourne un parking', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce(fakePark);

    const result = await getParkingById(1);
    expect(result).toEqual(fakePark);
  });

  test('❌ ID inexistant → statusCode 404', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce(null);

    await expect(getParkingById(999))
      .rejects.toMatchObject({ statusCode: 404, message: 'Parking introuvable' });
  });

});

// ─────────────────────────────────────────
describe('createParking', () => {

  test('✅ Crée un parking avec capacité', async () => {
    prisma.parkings.create.mockResolvedValueOnce(fakePark);

    const result = await createParking('Parking Jest', 'JestCity', 5, 1);
    expect(result).toEqual(fakePark);
    expect(result.capacity).toBe(5);
  });

  test('❌ Champs manquants → statusCode 400', async () => {
    await expect(createParking('', 'JestCity', 5))
      .rejects.toMatchObject({ statusCode: 400, message: 'Nom et ville requis' });
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.parkings.create.mockRejectedValueOnce(new Error('DB crash'));

    await expect(createParking('Parking Jest', 'JestCity', 5))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('updateParking', () => {

  test('✅ Met à jour un parking avec capacité', async () => {
    prisma.parkings.update.mockResolvedValueOnce({ ...fakePark, name: 'Modifié', capacity: 10 });

    const result = await updateParking(1, 'Modifié', 'JestCity', 10, 1);
    expect(result.name).toBe('Modifié');
    expect(result.capacity).toBe(10);
  });

  test('❌ Champs manquants → statusCode 400', async () => {
    await expect(updateParking(1, '', 'JestCity', 5, 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('❌ ID inexistant → propagate Prisma P2025', async () => {
    const p2025 = new Error('Record not found');
    p2025.code = 'P2025';
    prisma.parkings.update.mockRejectedValueOnce(p2025);

    await expect(updateParking(999, 'Nom', 'Ville', 5, 1))
      .rejects.toMatchObject({ code: 'P2025' });
  });

});

// ─────────────────────────────────────────
describe('deleteParking', () => {

  test('✅ Supprime un parking', async () => {
    prisma.parkings.delete.mockResolvedValueOnce(fakePark);

    const result = await deleteParking(1, 1);
    expect(result).toEqual(fakePark);
  });

  test('❌ ID inexistant → propagate Prisma P2025', async () => {
    const p2025 = new Error('Record not found');
    p2025.code = 'P2025';
    prisma.parkings.delete.mockRejectedValueOnce(p2025);

    await expect(deleteParking(999, 1))
      .rejects.toMatchObject({ code: 'P2025' });
  });

});

// ─────────────────────────────────────────
describe('updatePartialParking', () => {

  test('✅ Modification partielle (name)', async () => {
    prisma.parkings.update.mockResolvedValueOnce({ ...fakePark, name: 'Patch' });

    const result = await updatePartialParking(1, { name: 'Patch' }, 1);
    expect(result.name).toBe('Patch');
  });

  test('✅ Modification partielle (capacity)', async () => {
    prisma.parkings.update.mockResolvedValueOnce({ ...fakePark, capacity: 20 });

    const result = await updatePartialParking(1, { capacity: 20 }, 1);
    expect(result.capacity).toBe(20);
  });

  test('❌ Aucun champ valide → statusCode 400', async () => {
    await expect(updatePartialParking(1, { champInvalide: 'valeur' }, 1))
      .rejects.toMatchObject({ statusCode: 400, message: 'Aucun champ à modifier' });
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.parkings.update.mockRejectedValueOnce(new Error('DB crash'));

    await expect(updatePartialParking(999, { name: 'Patch' }, 1))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('checkAvailability', () => {

  test('✅ Parking disponible → isAvailable true, availableSpots > 0', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce({ id: 1, capacity: 5 });
    prisma.reservations.count.mockResolvedValueOnce(2);

    const result = await checkAvailability(1, '2026-06-10T00:00:00.000Z', '2026-06-12T00:00:00.000Z');

    expect(result.capacity).toBe(5);
    expect(result.occupiedSpots).toBe(2);
    expect(result.availableSpots).toBe(3);
    expect(result.isAvailable).toBe(true);
  });

  test('✅ Parking complet → isAvailable false, availableSpots 0', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce({ id: 1, capacity: 2 });
    prisma.reservations.count.mockResolvedValueOnce(2);

    const result = await checkAvailability(1, '2026-06-10T00:00:00.000Z', '2026-06-12T00:00:00.000Z');

    expect(result.capacity).toBe(2);
    expect(result.occupiedSpots).toBe(2);
    expect(result.availableSpots).toBe(0);
    expect(result.isAvailable).toBe(false);
  });

  test('✅ Aucun chevauchement → parking entièrement disponible', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce({ id: 1, capacity: 3 });
    prisma.reservations.count.mockResolvedValueOnce(0);

    const result = await checkAvailability(1, '2026-07-01T00:00:00.000Z', '2026-07-05T00:00:00.000Z');

    expect(result.occupiedSpots).toBe(0);
    expect(result.availableSpots).toBe(3);
    expect(result.isAvailable).toBe(true);
  });

  test('❌ Parking introuvable → statusCode 404', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce(null);

    await expect(checkAvailability(999, '2026-06-10T00:00:00.000Z', '2026-06-12T00:00:00.000Z'))
      .rejects.toMatchObject({ statusCode: 404, message: 'Parking introuvable' });
  });

  test('✅ Vérifie que le filtre de chevauchement est transmis à Prisma', async () => {
    prisma.parkings.findUnique.mockResolvedValueOnce({ id: 1, capacity: 5 });
    prisma.reservations.count.mockResolvedValueOnce(1);

    const checkin  = '2026-06-10T00:00:00.000Z';
    const checkout = '2026-06-12T00:00:00.000Z';

    await checkAvailability(1, checkin, checkout);

    expect(prisma.reservations.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          parking_id: 1,
          AND: expect.arrayContaining([
            expect.objectContaining({ checkin:  { lt: new Date(checkout) } }),
            expect.objectContaining({ checkout: { gte: new Date(checkin) } }),
          ]),
        }),
      })
    );
  });

});
