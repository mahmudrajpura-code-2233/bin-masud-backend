import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');
  const dataPath = path.join(__dirname, '../../frontend/data/products.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Products JSON file not found at', dataPath);
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const productsData = JSON.parse(rawData);

  // Extract unique categories
  const categoryNames = [...new Set(productsData.map((p: any) => p.category))];

  // Insert categories
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name: name as string },
      update: {},
      create: { name: name as string, description: `${name} fragrances` }
    });
  }

  console.log('Categories created/updated.');

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c: any) => [c.name, c.id]));

  // Insert products
  for (const p of productsData) {
    const catId = categoryMap.get(p.category) as string;
    if (!catId) continue;

    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: `Luxurious ${p.name} attar from our ${p.category} collection.`,
          price: p.price,
          stock: p.stock,
          categoryId: catId,
          sizes: JSON.stringify(["3ml", "6ml", "12ml", "25ml", "50ml"]),
          topNotes: JSON.stringify(["Top Note 1", "Top Note 2"]),
          middleNotes: JSON.stringify(["Heart Note 1", "Heart Note 2"]),
          baseNotes: JSON.stringify(["Base Note 1", "Base Note 2"])
        }
      });
    }
  }

  console.log('Seeding completed.');
}

async function run() {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
