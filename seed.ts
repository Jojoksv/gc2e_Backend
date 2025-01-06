import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Insertion des utilisateurs
  await prisma.user.createMany({
    data: [
      {
        email: 'jkossouvi@gmail.com',
        name: 'Joseph Kossouvi',
        password: 'Zougrane@23',
        role: 'admin',
      },
      {
        email: 'josephkossouvi488@gmail.com',
        name: 'Jojo Dxpe',
        password: 'JojoDxpe23',
        role: 'user',
      },
    ],
  });

  console.log('Utilisateurs insérés avec succès');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
