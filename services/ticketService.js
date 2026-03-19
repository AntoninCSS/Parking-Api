const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { RESERVATION_NOT_FOUND } = require('../constants/errors');

const formatDate = (date) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });

const generateTicket = async (parkingId, reservationId, res) => {
  const reservation = await prisma.reservations.findFirst({
    where: {
      id:         parseInt(reservationId),
      parking_id: parseInt(parkingId),
    },
    include: { parkings: true },
  });

  if (!reservation) {
    const error = new Error(RESERVATION_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  const token = jwt.sign(
    {
      reservationId: reservation.id,
      parkingId:     reservation.parking_id,
      license_plate: reservation.license_plate,
      checkin:       reservation.checkin,
      checkout:      reservation.checkout,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  const qrCodeDataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    width: 60,
  });
  const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

  // ─── Dimensions ───────────────────────────────────────────────────
  const TICKET_WIDTH  = 226;
  const TICKET_HEIGHT = 240; // réduit pour coller au format ticket réel
  const MARGIN        = 12;
  const CONTENT_WIDTH = TICKET_WIDTH - MARGIN * 2; // 202 pts

  const doc = new PDFDocument({
    size:    [TICKET_WIDTH, TICKET_HEIGHT],
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ticket-${reservation.id}.pdf"`
  );
  doc.pipe(res);

  const center  = { align: 'center', width: CONTENT_WIDTH };
  const sepLine = () => {
    doc
      .moveTo(MARGIN, doc.y)
      .lineTo(TICKET_WIDTH - MARGIN, doc.y)
      .strokeColor('#aaaaaa')
      .lineWidth(0.5)
      .dash(2, { space: 2 })
      .stroke()
      .undash();
    doc.moveDown(0.4);
  };

  // ─── En-tête ──────────────────────────────────────────────────────
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#1a1a2e')
    .text(reservation.parkings.name.toUpperCase(), MARGIN, MARGIN, center);

  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#666666')
    .text(reservation.parkings.city.toUpperCase(), center);

  doc.moveDown(0.4);
  sepLine();

  // ─── Titre ────────────────────────────────────────────────────────
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#1a1a2e')
    .text('TICKET DE RÉSERVATION', center);

  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#666666')
    .text(`N° ${reservation.id}`, center);

  doc.moveDown(0.4);
  sepLine();

  // ─── Infos ────────────────────────────────────────────────────────
  const LABEL_W = 65;
  const VALUE_W = CONTENT_WIDTH - LABEL_W;

  const drawRow = (label, value) => {
    const y = doc.y;
    doc
      .fontSize(7)
      .font('Helvetica-Bold')
      .fillColor('#444444')
      .text(label, MARGIN, y, { width: LABEL_W, lineBreak: false });
    doc
      .font('Helvetica')
      .fillColor('#1a1a2e')
      .text(value, MARGIN + LABEL_W, y, { width: VALUE_W, lineBreak: false });
    doc.moveDown(0.45);
  };

  drawRow('CLIENT :',    reservation.client_name);
  drawRow('VÉHICULE :',  reservation.vehicle);
  drawRow('PLAQUE :',    reservation.license_plate);
  drawRow('CHECK-IN :',  formatDate(reservation.checkin));
  drawRow('CHECK-OUT :', formatDate(reservation.checkout));

  doc.moveDown(0.4);
  sepLine();

  // ─── QR Code ──────────────────────────────────────────────────────
  doc
    .fontSize(6)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Scannez pour vérifier', center);

  doc.moveDown(0.3);

  const qrSize = 65;
  const qrX    = (TICKET_WIDTH - qrSize) / 2;
  const qrY    = doc.y;
  doc.image(qrCodeBuffer, qrX, qrY, { width: qrSize });

  doc.y = qrY + qrSize + 6;

  sepLine();

  // ─── Footer ───────────────────────────────────────────────────────
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#1a1a2e')
    .text('MERCI ET BONNE ROUTE !', center);

  doc.moveDown(0.3);

  doc
    .fontSize(6)
    .font('Helvetica')
    .fillColor('#aaaaaa')
    .text(`Généré le ${formatDate(new Date())} — Valable 30 jours`, center);

  doc.end();
};

module.exports = { generateTicket };