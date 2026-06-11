const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.category.deleteMany({ where: { name: 'oud' } });
  console.log('Deleted test category');
}

main().finally(() => prisma.$disconnect());
