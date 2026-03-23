import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";
import { sign, type Secret, type SignOptions } from "jsonwebtoken";
import prisma from "../../config/prisma";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { getSystemMetricsSnapshot } from "../system/system.service";
import { probeMlService } from "../ml/ml.service";

type AdminJwtPayload = {
  adminId: string;
  email: string;
  role: "admin";
};

type PaginationInput = {
  page?: number;
  limit?: number;
};

function getAdminToken(payload: AdminJwtPayload) {
  const jwtSecret: Secret = env.JWT_SECRET;
  const jwtOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return sign(payload, jwtSecret, jwtOptions);
}

export async function ensureBootstrapAdmin() {
  const adminCount = await prisma.admin.count();
  if (adminCount > 0) {
    return;
  }

  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  await prisma.admin.create({
    data: {
      email: env.ADMIN_EMAIL,
      password: hashedPassword,
      name: env.ADMIN_NAME
    }
  });
}

export async function loginAdmin(email: string, password: string) {
  await ensureBootstrapAdmin();

  const admin = await prisma.admin.findUnique({
    where: { email }
  });

  if (!admin) {
    throw new AppError("Invalid admin email or password", 401);
  }

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    throw new AppError("Invalid admin email or password", 401);
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      lastLoginAt: new Date()
    }
  });

  return {
    token: getAdminToken({
      adminId: admin.id,
      email: admin.email,
      role: "admin"
    }),
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      createdAt: admin.createdAt,
      lastLoginAt: new Date().toISOString()
    }
  };
}

function toPercent(value: number) {
  return Number(value.toFixed(2));
}

async function getOverviewSeries(days: number) {
  const labels: string[] = [];
  const activity: number[] = [];
  const expenses: number[] = [];
  const mlRequests: number[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - offset);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [activityCount, expenseCount, mlCount] = await Promise.all([
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: start,
            lt: end
          }
        }
      }),
      prisma.expense.count({
        where: {
          createdAt: {
            gte: start,
            lt: end
          }
        }
      }),
      prisma.mLLog.count({
        where: {
          createdAt: {
            gte: start,
            lt: end
          }
        }
      })
    ]);

    labels.push(start.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    activity.push(activityCount);
    expenses.push(expenseCount);
    mlRequests.push(mlCount);
  }

  return { labels, activity, expenses, mlRequests };
}

export async function getAdminOverview() {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalExpenses,
    smsImports,
    mlPredictions,
    convertedUsers,
    featureUsage,
    recentActivity,
    expenseCategories,
    series
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastActive: {
          gte: last24Hours
        }
      }
    }),
    prisma.expense.count(),
    prisma.activityLog.count({
      where: {
        action: "SMS_IMPORT"
      }
    }),
    prisma.mLLog.count(),
    prisma.user.count({
      where: {
        expenses: {
          some: {}
        }
      }
    }),
    prisma.activityLog.groupBy({
      by: ["feature"],
      where: {
        action: "FEATURE_USAGE",
        feature: {
          not: null
        }
      },
      _count: {
        feature: true
      },
      orderBy: {
        _count: {
          feature: "desc"
        }
      },
      take: 6
    }),
    prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 8,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: {
        amount: true
      },
      _count: {
        category: true
      },
      orderBy: {
        _sum: {
          amount: "desc"
        }
      },
      take: 6
    }),
    getOverviewSeries(7)
  ]);

  return {
    stats: {
      totalUsers,
      activeUsers,
      totalExpenses,
      smsImports,
      mlPredictions,
      conversionRate: totalUsers ? toPercent((convertedUsers / totalUsers) * 100) : 0
    },
    featureUsage: featureUsage.map((item) => ({
      feature: item.feature,
      count: item._count.feature
    })),
    expenseCategories: expenseCategories.map((item) => ({
      category: item.category,
      totalAmount: Number(item._sum.amount ?? 0),
      count: item._count.category
    })),
    activitySeries: series,
    recentActivity
  };
}

export async function getAdminUsers({ page = 1, limit = 20 }: PaginationInput) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            expenses: true,
            activityLogs: true,
            mlLogs: true
          }
        }
      }
    }),
    prisma.user.count()
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      totalActions: user.totalActions,
      deviceType: user.deviceType,
      expenseCount: user._count.expenses,
      activityCount: user._count.activityLogs,
      mlRequestCount: user._count.mlLogs
    })),
    meta: {
      total,
      page,
      limit
    }
  };
}

export async function getAdminActivity({ page = 1, limit = 25 }: PaginationInput) {
  const skip = (page - 1) * limit;

  const [activity, total, summary] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.activityLog.count(),
    prisma.activityLog.groupBy({
      by: ["action"],
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: "desc"
        }
      }
    })
  ]);

  return {
    logs: activity,
    summary: summary.map((item) => ({
      action: item.action,
      count: item._count.action
    })),
    meta: {
      total,
      page,
      limit
    }
  };
}

export async function getAdminMl({ page = 1, limit = 25 }: PaginationInput) {
  const skip = (page - 1) * limit;

  const [logs, total, totalCount, successCount, avgResponse, categoryStats] =
    await Promise.all([
      prisma.mLLog.findMany({
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.mLLog.count(),
      prisma.mLLog.count(),
      prisma.mLLog.count({
        where: {
          success: true
        }
      }),
      prisma.mLLog.aggregate({
        _avg: {
          responseTimeMs: true
        }
      }),
      prisma.mLLog.groupBy({
        by: ["category"],
        where: {
          category: {
            not: null
          }
        },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: "desc"
          }
        },
        take: 8
      })
    ]);

  return {
    stats: {
      totalPredictions: totalCount,
      successRate: totalCount ? toPercent((successCount / totalCount) * 100) : 0,
      averageResponseTimeMs: Number(avgResponse._avg.responseTimeMs ?? 0)
    },
    categories: categoryStats.map((item) => ({
      category: item.category,
      count: item._count.category
    })),
    logs,
    meta: {
      total,
      page,
      limit
    }
  };
}

async function getDatabaseHealth() {
  try {
    const startedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      responseTimeMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTimeMs: 0,
      message: error instanceof Error ? error.message : "Database check failed"
    };
  }
}

export async function getAdminSystem() {
  const [dbHealth, mlHealth] = await Promise.all([
    getDatabaseHealth(),
    probeMlService()
  ]);

  return {
    runtime: getSystemMetricsSnapshot(),
    services: {
      database: dbHealth,
      ml: mlHealth
    },
    process: {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    }
  };
}
