import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // Income categories
  { name: 'Salary', type: CategoryType.INCOME, isDefault: true },
  { name: 'Freelance', type: CategoryType.INCOME, isDefault: true },
  { name: 'Investments', type: CategoryType.INCOME, isDefault: true },
  { name: 'Other Income', type: CategoryType.INCOME, isDefault: true },

  // Expense categories
  { name: 'Housing', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Utilities', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Transportation', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Food & Dining', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Healthcare', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Insurance', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Entertainment', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Shopping', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Personal Care', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Education', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Gifts & Donations', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Taxes', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Other Expenses', type: CategoryType.EXPENSE, isDefault: true },

  // Investment categories
  { name: 'Stocks', type: CategoryType.INVESTMENT, isDefault: true },
  { name: 'Bonds', type: CategoryType.INVESTMENT, isDefault: true },
  { name: 'Mutual Funds', type: CategoryType.INVESTMENT, isDefault: true },
  { name: 'Real Estate', type: CategoryType.INVESTMENT, isDefault: true },
  { name: 'Cryptocurrency', type: CategoryType.INVESTMENT, isDefault: true },

  // Transfer categories
  { name: 'Account Transfer', type: CategoryType.TRANSFER, isDefault: true },
  { name: 'Investment Transfer', type: CategoryType.TRANSFER, isDefault: true },
];

async function main() {
  console.log('Start seeding default categories...');

  for (const category of defaultCategories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
        type: category.type,
        isDefault: true,
      },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: category,
      });
      console.log(`Created default category: ${category.name} (${category.type})`);
    } else {
      console.log(`Default category already exists: ${category.name} (${category.type})`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 