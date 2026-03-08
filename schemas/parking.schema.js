const { z } = require('zod');

const parkingSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  city: z.string().min(1, "La ville est requise"),
});



// Ajoute un .optional() sur tout le shcéma pour la méthode PATCH
const parkingPartialSchema = parkingSchema.partial(); 

module.exports = { parkingSchema, parkingPartialSchema };