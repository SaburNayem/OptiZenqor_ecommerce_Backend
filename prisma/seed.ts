import { PrismaClient, ProductStatus, SupportPriority, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('Password123!', saltRounds);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@optizenqor.com' },
    update: {},
    create: {
      fullName: 'OptiZenqor Super Admin',
      email: 'superadmin@optizenqor.com',
      phone: '+8801700000001',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      cart: { create: {} },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@optizenqor.com' },
    update: {},
    create: {
      fullName: 'OptiZenqor Admin',
      email: 'admin@optizenqor.com',
      phone: '+8801700000002',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      cart: { create: {} },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@optizenqor.com' },
    update: {},
    create: {
      fullName: 'Demo Customer',
      email: 'customer@optizenqor.com',
      phone: '+8801700000003',
      passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cart: { create: {} },
      addresses: {
        create: {
          label: 'Home',
          fullName: 'Demo Customer',
          phone: '+8801700000003',
          addressLine1: 'House 12, Road 4',
          city: 'Dhaka',
          area: 'Mirpur 1',
          postalCode: '1216',
          country: 'Bangladesh',
          isDefault: true,
        },
      },
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'smart-devices' },
      update: {},
      create: {
        name: 'Smart Devices',
        slug: 'smart-devices',
        description: 'Connected devices for healthy everyday routines.',
        bannerTitle: 'Smarter Living Starts Here',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'wellness-accessories' },
      update: {},
      create: {
        name: 'Wellness Accessories',
        slug: 'wellness-accessories',
        description: 'Lifestyle accessories built for comfort and consistency.',
        bannerTitle: 'Small Tools, Better Habits',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'nutrition' },
      update: {},
      create: {
        name: 'Nutrition',
        slug: 'nutrition',
        description: 'Nutrition-first products and daily essentials.',
        bannerTitle: 'Fuel Your Progress',
      },
    }),
  ]);

  const offer = await prisma.offer.upsert({
    where: { slug: 'launch-week' },
    update: {},
    create: {
      label: 'Launch Week',
      slug: 'launch-week',
      description: 'Introductory pricing for new customers.',
      isActive: true,
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'optitrack-band' },
      update: {},
      create: {
        name: 'OptiTrack Band',
        slug: 'optitrack-band',
        description: 'A lightweight smart band with wellness tracking and seamless app sync.',
        shortDescription: 'Smart tracking band for daily routines.',
        sku: 'OZ-BAND-001',
        price: 3999,
        compareAtPrice: 4499,
        stockQuantity: 50,
        imageUrl: 'https://images.example.com/optitrack-band.jpg',
        galleryImages: ['https://images.example.com/optitrack-band.jpg'],
        isFeatured: true,
        isPopular: true,
        isVisible: true,
        status: ProductStatus.ACTIVE,
        primaryCategoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'zenmat-pro' },
      update: {},
      create: {
        name: 'ZenMat Pro',
        slug: 'zenmat-pro',
        description: 'A premium daily recovery mat for home stretching and guided sessions.',
        shortDescription: 'Comfort-first recovery mat.',
        sku: 'OZ-MAT-002',
        price: 2499,
        compareAtPrice: 2999,
        stockQuantity: 80,
        imageUrl: 'https://images.example.com/zenmat-pro.jpg',
        galleryImages: ['https://images.example.com/zenmat-pro.jpg'],
        isFeatured: true,
        isVisible: true,
        status: ProductStatus.ACTIVE,
        primaryCategoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'daily-fuel-pack' },
      update: {},
      create: {
        name: 'Daily Fuel Pack',
        slug: 'daily-fuel-pack',
        description: 'A curated nutrition pack for energy, hydration, and consistency.',
        shortDescription: 'Everyday nutrition essentials.',
        sku: 'OZ-NUTR-003',
        price: 1899,
        compareAtPrice: 2199,
        stockQuantity: 120,
        imageUrl: 'https://images.example.com/daily-fuel-pack.jpg',
        galleryImages: ['https://images.example.com/daily-fuel-pack.jpg'],
        isPopular: true,
        isVisible: true,
        status: ProductStatus.ACTIVE,
        primaryCategoryId: categories[2].id,
      },
    }),
  ]);

  for (const product of products) {
    await prisma.productCategoryPivot.createMany({
      data: [
        {
          productId: product.id,
          categoryId: product.primaryCategoryId!,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.productOfferPivot.createMany({
      data: [
        {
          productId: product.id,
          offerId: offer.id,
        },
      ],
      skipDuplicates: true,
    });
  }

  await Promise.all([
    prisma.homepageSection.upsert({
      where: { key: 'hero' },
      update: {},
      create: {
        key: 'hero',
        title: 'Elevate Everyday Wellness',
        subtitle: 'Products, routines, and offers connected in one ecosystem.',
        contentJson: {
          ctaLabel: 'Shop Now',
          ctaUrl: '/products',
          highlight: 'Unified mobile, web, and admin experience',
        },
        isActive: true,
      },
    }),
    prisma.homepageSection.upsert({
      where: { key: 'featured-products' },
      update: {},
      create: {
        key: 'featured-products',
        title: 'Featured Picks',
        subtitle: 'Top products chosen for launch.',
        contentJson: {
          productSlugs: products.map((product) => product.slug),
        },
        isActive: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.featureFlag.upsert({
      where: { key: 'checkout-v2' },
      update: {},
      create: {
        key: 'checkout-v2',
        label: 'Checkout V2',
        description: 'Gradual rollout for the next checkout experience.',
        environment: 'BETA',
        isEnabled: true,
        rolloutPercentage: 35,
      },
    }),
    prisma.featureFlag.upsert({
      where: { key: 'support-live-chat' },
      update: {},
      create: {
        key: 'support-live-chat',
        label: 'Support Live Chat',
        description: 'Enable richer support chat experiences.',
        environment: 'INTERNAL',
        isEnabled: false,
        rolloutPercentage: 0,
      },
    }),
  ]);

  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'currency' },
      update: {},
      create: {
        key: 'currency',
        value: 'BDT',
        description: 'Default storefront currency',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'support_email' },
      update: {},
      create: {
        key: 'support_email',
        value: 'support@optizenqor.com',
        description: 'Primary support contact',
      },
    }),
  ]);

  await prisma.contentPost.upsert({
    where: { slug: 'launch-story' },
    update: {},
    create: {
      title: 'The OptiZenqor Launch Story',
      slug: 'launch-story',
      summary: 'How the ecosystem came together across mobile, web, and admin.',
      body: 'OptiZenqor is designed to connect products, content, and support into one reliable customer experience.',
      type: 'editorial',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const thread = await prisma.supportThread.create({
    data: {
      userId: customer.id,
      subject: 'Order timing question',
      priority: SupportPriority.MEDIUM,
      status: 'OPEN',
    },
  });

  await prisma.supportMessage.createMany({
    data: [
      {
        threadId: thread.id,
        senderId: customer.id,
        senderType: 'CUSTOMER',
        message: 'How long does delivery usually take in Dhaka?',
      },
      {
        threadId: thread.id,
        senderId: admin.id,
        senderType: 'ADMIN',
        message: 'Typical delivery is 2 to 3 business days inside Dhaka.',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully');
  console.log({
    superAdmin: superAdmin.email,
    admin: admin.email,
    customer: customer.email,
    password: 'Password123!',
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
