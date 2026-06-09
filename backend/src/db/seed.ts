import { prisma } from './index';

/**
 * Seeds the database with a sample ShopEasy support conversation.
 */
async function seed(): Promise<void> {
  const existing = await prisma.conversation.findFirst({
    where: {
      messages: {
        some: {
          text: { contains: 'return policy' },
        },
      },
    },
  });

  if (existing) {
    console.log('Sample conversation already exists, skipping seed.');
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      messages: {
        create: [
          {
            sender: 'user',
            text: 'Hi, what is your return policy?',
          },
          {
            sender: 'ai',
            text: 'Hello! Welcome to ShopEasy. Items can be returned within 30 days of delivery. Products must be unused and in original packaging. Refunds are processed within 5-7 business days to your original payment method. Is there anything else I can help you with?',
          },
          {
            sender: 'user',
            text: 'Do you offer free shipping?',
          },
          {
            sender: 'ai',
            text: 'Yes! We offer free shipping on all orders above ₹999. For orders below that amount, standard shipping rates apply. Domestic delivery typically takes 3-5 business days.',
          },
        ],
      },
    },
    include: { messages: true },
  });

  console.log(`Seeded sample conversation: ${conversation.id}`);
  console.log(`  Messages: ${conversation.messages.length}`);
}

seed()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
