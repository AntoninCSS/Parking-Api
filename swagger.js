const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Parking API",
      version: "1.0.0",
      description: "API pour gérer les parkings"
    },
    servers: [
      {
        url: "http://localhost:3446",
        description: "Development server"
      }
    ],
    components: {
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
        }
      }
    }
  },
  apis: ["./routes/*.js"]
};

const specs = swaggerJsdoc(options);
module.exports = specs;