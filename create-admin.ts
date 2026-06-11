import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@binmasud.com' },
    update: { role: 'ADMIN', password: hash },
    create: { email: 'admin@binmasud.com', name: 'Admin', password: hash, role: 'ADMIN' }
  });
  console.log('Admin user created successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
