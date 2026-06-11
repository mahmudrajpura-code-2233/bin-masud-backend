const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Latest products:', products.map(p => p.name));
}
main().finally(() => prisma.$disconnect());
