import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    id: 1,
    name: 'Portail Métallique Modern',
    price: 1299,
    oldPrice: 3000,
    category: 'Portes',
    rating: 4.5,
    reviews: 85,
    description:
      'Une porte métallique moderne, durable et élégante, idéale pour protéger votre domicile.',
    features: [
      'Construction en acier renforcé',
      'Système de verrouillage multipoints',
      'Finition anti-corrosion',
      'Facile à entretenir',
      'Fabrication artisanale',
    ],
    images: ['portail', 'porte1', 'portail'],
  },
  {
    id: 2,
    name: 'Chaise Design Métal',
    price: 299,
    oldPrice: 300,
    category: 'Chaises',
    rating: 4,
    reviews: 42,
    description:
      'Une chaise en métal au design moderne, parfaite pour les intérieurs contemporains.',
    features: [
      'Structure en métal robuste',
      'Assise confortable avec revêtement en tissu',
      'Pieds antidérapants',
      'Design empilable',
      'Facile à transporter',
    ],
    images: ['fauteuilSeul', 'fauteuilGroupe', 'fauteuilSeul'],
  },
  {
    id: 3,
    name: 'Table Banc',
    price: 599,
    oldPrice: 800,
    category: 'Tables',
    rating: 3.8,
    reviews: 20,
    description:
      'Table avec banc intégré, idéale pour les salles à manger modernes.',
    features: [
      'Structure en acier et bois massif',
      'Surface résistante aux rayures',
      'Facile à assembler',
      'Convient à plusieurs usages',
      'Design contemporain',
    ],
    images: ['tableBanc', 'tableBanc', 'tableBanc'],
  },
  {
    id: 4,
    name: 'Armoire Métallique',
    price: 449,
    oldPrice: 600,
    category: 'Mobilier intérieur',
    rating: 4.2,
    reviews: 31,
    description:
      'Armoire métallique robuste, parfaite pour ranger vos affaires en toute sécurité.',
    features: [
      'Construction en métal robuste',
      'Plusieurs étagères ajustables',
      'Portes verrouillables',
      'Finition résistante aux rayures',
      'Facile à nettoyer',
    ],
    images: ['armoire', 'armoireOuverte', 'armoire'],
  },
  {
    id: 5,
    name: 'Porte en Métal Lourd',
    price: 2499,
    oldPrice: 3000,
    category: 'Portes',
    rating: 4.8,
    reviews: 120,
    description:
      'Une porte en métal lourde, offrant une sécurité maximale et un design intemporel.',
    features: [
      'Fabrication en acier massif',
      'Système anti-effraction',
      'Isolation acoustique et thermique',
      'Peinture de haute qualité',
      'Installation facile',
    ],
    images: ['porte1', 'portail', 'porte1'],
  },
  {
    id: 6,
    name: 'Balançoire de Jardin',
    price: 399,
    oldPrice: 500,
    category: 'Mobilier extérieur',
    rating: 4.1,
    reviews: 45,
    description:
      'Une balançoire élégante et robuste, idéale pour votre jardin.',
    features: [
      'Cadre en métal résistant aux intempéries',
      'Siège confortable avec rembourrage',
      'Système de suspension sécurisé',
      'Facile à monter',
      'Design esthétique',
    ],
    images: ['balancoire', 'balancoire1', 'balancoire'],
  },
  {
    id: 7,
    name: 'Grillage à Motif Architectural',
    price: 399,
    oldPrice: 500,
    category: 'Mobilier extérieur',
    rating: 3.9,
    reviews: 18,
    description:
      'Grillage métallique élégant, parfait pour sécuriser et embellir vos espaces extérieurs.',
    features: [
      'Motif architectural unique',
      'Traitement anti-corrosion',
      'Installation facile',
      'Durable et robuste',
      'Adapté à tous les styles',
    ],
    images: ['grillageMotif', 'grillageMotif', 'grillageMotif'],
  },
  {
    id: 8,
    name: 'Portes à Design Architectural Multiple',
    price: 399,
    oldPrice: 500,
    category: 'Portes',
    rating: 4.6,
    reviews: 30,
    description:
      'Une porte design avec des motifs architecturaux multiples, parfaite pour un look unique.',
    features: [
      'Design sur mesure',
      'Matériaux de haute qualité',
      'Finition élégante',
      'Résistant aux intempéries',
      'Installation rapide',
    ],
    images: ['multiPorte', 'multiPorte', 'multiPorte'],
  },
  {
    id: 9,
    name: 'Chaises et Table en Acier',
    price: 399,
    oldPrice: 500,
    category: 'Mobilier extérieur',
    rating: 4.4,
    reviews: 50,
    description:
      'Ensemble de chaises et table en acier, parfait pour votre terrasse ou jardin.',
    features: [
      'Structure entièrement en acier',
      'Résistant aux intempéries',
      'Facile à nettoyer',
      'Design intemporel',
      "Capacité d'accueil optimale",
    ],
    images: [
      'chaisesTableMetal',
      'chaisesTableMetallique',
      'chaisesTableMetal',
    ],
  },
];

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

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Utilisateurs et Products insérés avec succès');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
