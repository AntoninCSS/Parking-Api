const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Parking API",
      version: "1.1.2",
      description: "API pour gérer les parkings"
    },
    servers: [
      {
        url: "http://localhost:3446",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenu via /auth/login"
        }
      },
      parameters: {
        parkingId: {
          in: "path",
          name: "parkingId",
          required: true,
          schema: { type: "integer" },
          description: "ID unique du parking",
          example: 1
        },
        reservationId: {
          in: "path",
          name: "reservationId",
          required: true,
          schema: { type: "integer" },
          description: "ID unique de la réservation",
          example: 1
        }
      },
      schemas: {
        Parking: {
          type: "object",
          required: ["name", "city", "type"],
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "ID unique du parking"
            },
            name: {
              type: "string",
              example: "Parking A",
              description: "Nom du parking"
            },
            city: {
              type: "string",
              example: "Paris",
              description: "Ville où se trouve le parking"
            },
            type: {
              type: "string",
              enum: ["outdoor", "indoor", "underground"],
              example: "outdoor",
              description: "Type de parking"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-03-01T10:00:00Z",
              description: "Date de création"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-03-01T15:30:00Z",
              description: "Date de dernière modification"
            }
          }
        },
        Reservation: {
          type: "object",
          required: ["client_name", "vehicle", "license_plate", "checkin", "checkout"],
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "ID unique de la réservation"
            },
            parking_id: {
              type: "integer",
              example: 1,
              description: "ID du parking associé"
            },
            client_name: {
              type: "string",
              example: "Jean Dupont",
              description: "Nom du client"
            },
            vehicle: {
              type: "string",
              example: "Voiture",
              description: "Type de véhicule"
            },
            license_plate: {
              type: "string",
              example: "AB-123-CD",
              description: "Plaque d'immatriculation"
            },
            checkin: {
              type: "string",
              example: "10/03/2026",
              description: "Date d'entrée (DD/MM/YYYY)"
            },
            checkout: {
              type: "string",
              example: "11/03/2026",
              description: "Date de sortie (DD/MM/YYYY)"
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-03-01T10:00:00Z",
              description: "Date de création"
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2026-03-01T15:30:00Z",
              description: "Date de dernière modification"
            }
          }
        }
      }
    }
  },
  apis: ["./routes/*.js"]
};

const specs = swaggerJsdoc(options);
module.exports = specs;