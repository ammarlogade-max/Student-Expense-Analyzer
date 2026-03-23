export type PaymentMode = "CASH" | "DIGITAL";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  lastActive?: string | null;
  totalActions?: number;
  deviceType?: string | null;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  paymentMode: PaymentMode;
  description?: string | null;
  createdAt: string;
};

export type MonthlySummary = {
  total: number;
  byCategory: Record<string, number>;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  lastLoginAt?: string;
};

export type ActivityLogItem = {
  id: string;
  actorType: "USER" | "ADMIN" | "SYSTEM";
  action: string;
  feature?: string | null;
  description?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  admin?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type AdminOverview = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalExpenses: number;
    smsImports: number;
    mlPredictions: number;
    conversionRate: number;
  };
  featureUsage: Array<{
    feature: string | null;
    count: number;
  }>;
  expenseCategories: Array<{
    category: string;
    totalAmount: number;
    count: number;
  }>;
  activitySeries: {
    labels: string[];
    activity: number[];
    expenses: number[];
    mlRequests: number[];
  };
  recentActivity: ActivityLogItem[];
};

export type AdminUsersResponse = {
  success: boolean;
  users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    lastActive?: string | null;
    totalActions: number;
    deviceType?: string | null;
    expenseCount: number;
    activityCount: number;
    mlRequestCount: number;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

export type AdminActivityResponse = {
  success: boolean;
  logs: ActivityLogItem[];
  summary: Array<{
    action: string;
    count: number;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

export type AdminMlResponse = {
  success: boolean;
  stats: {
    totalPredictions: number;
    successRate: number;
    averageResponseTimeMs: number;
  };
  categories: Array<{
    category: string | null;
    count: number;
  }>;
  logs: Array<{
    id: string;
    requestType: string;
    merchant?: string | null;
    category?: string | null;
    success: boolean;
    responseTimeMs: number;
    createdAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
};

export type AdminSystemResponse = {
  success: boolean;
  system: {
    runtime: {
      uptimeSeconds: number;
      requestCount: number;
      errorCount: number;
      averageResponseTimeMs: number;
      p95ResponseTimeMs: number;
      recentRequests: Array<{
        method: string;
        path: string;
        statusCode: number;
        durationMs: number;
        createdAt: string;
      }>;
    };
    services: {
      database: {
        status: string;
        responseTimeMs: number;
      };
      ml: {
        status: string;
        responseTimeMs: number;
      };
    };
  };
};
