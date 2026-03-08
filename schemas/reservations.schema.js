const { z } = require('zod');

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

const reservationSchema = z.object({
  client_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  vehicle: z.string().min(1, "Le véhicule est requis"),
  license_plate: z.string().min(1, "La plaque d'immatriculation est requise"),
  checkin: z.string().regex(dateRegex, "Format attendu : DD/MM/YYYY"),
  checkout: z.string().regex(dateRegex, "Format attendu : DD/MM/YYYY"),
});

const reservationPartialSchema = reservationSchema.partial();

module.exports = { reservationSchema, reservationPartialSchema };