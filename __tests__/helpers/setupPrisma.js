const prisma = require('../../config/prisma');

const cleanDB = async () => {
  await prisma.refresh_tokens.deleteMany();
  await prisma.reservations.deleteMany();
  await prisma.parkings.deleteMany();
  await prisma.users.deleteMany();
  await prisma.logs.deleteMany();
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

module.exports = { cleanDB, disconnectDB };