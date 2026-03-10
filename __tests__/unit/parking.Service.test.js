jest.mock('../../config/prisma', () => ({
  parkings: {
    findMany:   jest.fn(),
    count:      jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
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
} = require('../../services/parkingService');

beforeEach(() => {
  jest.resetAllMocks();
  log.mockResolvedValue();
});

const fakePark = { id: 1, name: 'Parking Jest', city: 'JestCity' };

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

  test('✅ Crée un parking', async () => {
    prisma.parkings.create.mockResolvedValueOnce(fakePark);

    const result = await createParking('Parking Jest', 'JestCity', 1);
    expect(result).toEqual(fakePark);
  });

  test('❌ Champs manquants → statusCode 400', async () => {
    await expect(createParking('', 'JestCity', 1))
      .rejects.toMatchObject({ statusCode: 400, message: 'Nom et ville requis' });
  });

  test('❌ Erreur BDD → throw', async () => {
    prisma.parkings.create.mockRejectedValueOnce(new Error('DB crash'));

    await expect(createParking('Parking Jest', 'JestCity', 1))
      .rejects.toThrow('DB crash');
  });

});

// ─────────────────────────────────────────
describe('updateParking', () => {

  test('✅ Met à jour un parking', async () => {
    prisma.parkings.update.mockResolvedValueOnce({ ...fakePark, name: 'Modifié' });

    const result = await updateParking(1, 'Modifié', 'JestCity', 1);
    expect(result.name).toBe('Modifié');
  });

  test('❌ Champs manquants → statusCode 400', async () => {
    await expect(updateParking(1, '', 'JestCity', 1))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('❌ ID inexistant → propagate Prisma P2025', async () => {
    const p2025 = new Error('Record not found');
    p2025.code = 'P2025';
    prisma.parkings.update.mockRejectedValueOnce(p2025);

    await expect(updateParking(999, 'Nom', 'Ville', 1))
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

  test('✅ Modification partielle', async () => {
    prisma.parkings.update.mockResolvedValueOnce({ ...fakePark, name: 'Patch' });

    const result = await updatePartialParking(1, { name: 'Patch' }, 1);
    expect(result.name).toBe('Patch');
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
