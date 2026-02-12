import prisma from "../../config/prisma";

interface CreateExpenseInput {
  userId: string;
  amount: number;
  category: string;
  description?: string;
}

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  page?: number;
  limit?: number;
}

export async function createExpense(data: CreateExpenseInput) {
  const { userId, amount, category, description } = data;

  return prisma.expense.create({
    data: {
      userId,
      amount,
      category,
      description
    }
  });
}

export async function getUserExpenses(
  userId: string,
  filters: ExpenseFilters
) {
  const where: any = { userId };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  if (filters.query) {
    where.OR = [
      { category: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } }
    ];
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.expense.count({ where })
  ]);

  return {
    items,
    total,
    page,
    limit
  };
}

export async function updateExpense(
  userId: string,
  id: string,
  data: Partial<CreateExpenseInput>
) {
  const existing = await prisma.expense.findFirst({
    where: { id, userId }
  });
  if (!existing) {
    return null;
  }
  return prisma.expense.update({
    where: { id },
    data
  });
}

export async function deleteExpense(userId: string, id: string) {
  const existing = await prisma.expense.findFirst({
    where: { id, userId }
  });
  if (!existing) {
    return null;
  }
  return prisma.expense.delete({
    where: { id }
  });
}

export async function getMonthlySummary(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory: Record<string, number> = {};

  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return {
    total,
    byCategory
  };
}
