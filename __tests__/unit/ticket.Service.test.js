// ─── Mocks (avant les requires) ───────────────────────────────────────────────
jest.mock('../../config/prisma', () => ({
  reservations: {
    findFirst: jest.fn(),
  },
}));

jest.mock('qrcode');
jest.mock('jsonwebtoken');

const mockDoc = {
  pipe:        jest.fn(),
  end:         jest.fn(),
  text:        jest.fn().mockReturnThis(),
  font:        jest.fn().mockReturnThis(),
  fontSize:    jest.fn().mockReturnThis(),
  fillColor:   jest.fn().mockReturnThis(),
  moveTo:      jest.fn().mockReturnThis(),
  lineTo:      jest.fn().mockReturnThis(),
  strokeColor: jest.fn().mockReturnThis(),
  lineWidth:   jest.fn().mockReturnThis(),
  dash:        jest.fn().mockReturnThis(),
  stroke:      jest.fn().mockReturnThis(),
  undash:      jest.fn().mockReturnThis(),
  moveDown:    jest.fn().mockReturnThis(),
  image:       jest.fn().mockReturnThis(),
  y: 100,
};

jest.mock('pdfkit', () => jest.fn(() => mockDoc));

// ─── Requires ─────────────────────────────────────────────────────────────────
const prisma    = require('../../config/prisma');
const QRCode    = require('qrcode');
const jwt       = require('jsonwebtoken');
const { generateTicket } = require('../../services/ticketService');

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const fakeReservation = {
  id:            42,
  parking_id:    1,
  client_name:   'Jean Dupont',
  vehicle:       'Voiture',
  license_plate: 'AB-123-CD',
  checkin:       new Date('2026-03-10T00:00:00.000Z'),
  checkout:      new Date('2026-03-11T00:00:00.000Z'),
  parkings: {
    name: 'Parking Jest',
    city: 'JestCity',
  },
};

const mockRes = () => ({ setHeader: jest.fn() });

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret';
});

beforeEach(() => {
  jest.clearAllMocks();

  // Rétablir les implémentations chaînables sur mockDoc
  Object.assign(mockDoc, {
    pipe:        jest.fn(),
    end:         jest.fn(),
    text:        jest.fn().mockReturnThis(),
    font:        jest.fn().mockReturnThis(),
    fontSize:    jest.fn().mockReturnThis(),
    fillColor:   jest.fn().mockReturnThis(),
    moveTo:      jest.fn().mockReturnThis(),
    lineTo:      jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    lineWidth:   jest.fn().mockReturnThis(),
    dash:        jest.fn().mockReturnThis(),
    stroke:      jest.fn().mockReturnThis(),
    undash:      jest.fn().mockReturnThis(),
    moveDown:    jest.fn().mockReturnThis(),
    image:       jest.fn().mockReturnThis(),
    y: 100,
  });

  // Défauts pour QRCode et JWT
  QRCode.toDataURL.mockResolvedValue('data:image/png;base64,abc123==');
  jwt.sign.mockReturnValue('mocked.jwt.token');
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('generateTicket', () => {

  test('✅ Pipe le PDF dans la réponse HTTP', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    const res = mockRes();

    await generateTicket(1, 42, res);

    expect(mockDoc.pipe).toHaveBeenCalledWith(res);
    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('✅ Définit les headers Content-Type et Content-Disposition corrects', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    const res = mockRes();

    await generateTicket(1, 42, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="ticket-${fakeReservation.id}.pdf"`
    );
  });

  test('✅ Signe un token JWT avec les données de la réservation', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    const res = mockRes();

    await generateTicket(1, 42, res);

    expect(jwt.sign).toHaveBeenCalledWith(
      {
        reservationId: fakeReservation.id,
        parkingId:     fakeReservation.parking_id,
        license_plate: fakeReservation.license_plate,
        checkin:       fakeReservation.checkin,
        checkout:      fakeReservation.checkout,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  });

  test('✅ Génère un QR code à partir du token JWT', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    const res = mockRes();

    await generateTicket(1, 42, res);

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'mocked.jwt.token',
      expect.objectContaining({ errorCorrectionLevel: 'M', width: 60 })
    );
  });

  test('✅ Insère une image QR dans le PDF', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    const res = mockRes();

    await generateTicket(1, 42, res);

    expect(mockDoc.image).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ width: 65 })
    );
  });

  test('✅ Recherche la réservation avec le bon parkingId et reservationId', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    const res = mockRes();

    await generateTicket('1', '42', res);

    expect(prisma.reservations.findFirst).toHaveBeenCalledWith({
      where: { id: 42, parking_id: 1 },
      include: { parkings: true },
    });
  });

  test('❌ Réservation introuvable → throw 404', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(null);
    const res = mockRes();

    await expect(generateTicket(1, 999, res))
      .rejects.toMatchObject({ statusCode: 404, message: 'Réservation introuvable' });
  });

  test('❌ Erreur BDD → throw propagé', async () => {
    prisma.reservations.findFirst.mockRejectedValueOnce(new Error('DB crash'));
    const res = mockRes();

    await expect(generateTicket(1, 42, res))
      .rejects.toThrow('DB crash');
  });

  test('❌ Erreur QRCode → throw propagé', async () => {
    prisma.reservations.findFirst.mockResolvedValueOnce(fakeReservation);
    QRCode.toDataURL.mockRejectedValueOnce(new Error('QR error'));
    const res = mockRes();

    await expect(generateTicket(1, 42, res))
      .rejects.toThrow('QR error');
  });

});
