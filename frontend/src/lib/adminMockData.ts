import type {
  AdminActivityResponse,
  AdminMlResponse,
  AdminOverview,
  AdminSystemResponse,
  AdminUsersResponse,
  ActivityLogItem
} from "./types";

const NOW = new Date("2026-03-23T14:30:00+05:30");

const hoursAgo = (hours: number) =>
  new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();

const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const userProfiles = [
  ["Aarav Sharma", "aarav.sharma@testlab.app", "Android"],
  ["Diya Patel", "diya.patel@testlab.app", "iPhone"],
  ["Vihaan Gupta", "vihaan.gupta@testlab.app", "Web"],
  ["Anaya Singh", "anaya.singh@testlab.app", "Android"],
  ["Arjun Verma", "arjun.verma@testlab.app", "Android"],
  ["Sara Khan", "sara.khan@testlab.app", "iPhone"],
  ["Kabir Mehta", "kabir.mehta@testlab.app", "Web"],
  ["Ira Nair", "ira.nair@testlab.app", "Android"],
  ["Reyansh Das", "reyansh.das@testlab.app", "Android"],
  ["Myra Iyer", "myra.iyer@testlab.app", "iPhone"],
  ["Advik Rao", "advik.rao@testlab.app", "Web"],
  ["Siya Joshi", "siya.joshi@testlab.app", "Android"],
  ["Rohan Malhotra", "rohan.malhotra@testlab.app", "Android"],
  ["Aisha Ali", "aisha.ali@testlab.app", "iPhone"],
  ["Kian Kapoor", "kian.kapoor@testlab.app", "Web"],
  ["Meera Bansal", "meera.bansal@testlab.app", "Android"],
  ["Yuvan Chawla", "yuvan.chawla@testlab.app", "Android"],
  ["Navya Reddy", "navya.reddy@testlab.app", "iPhone"],
  ["Ishaan Jain", "ishaan.jain@testlab.app", "Web"],
  ["Tara Menon", "tara.menon@testlab.app", "Android"]
] as const;

const adminUsers = userProfiles.map(([name, email, deviceType], index) => ({
  id: `test-user-${index + 1}`,
  name,
  email,
  createdAt: daysAgo(45 - index),
  lastActive: hoursAgo(index * 2 + 1),
  totalActions: 28 + index * 5,
  deviceType,
  expenseCount: 5 + (index % 7) * 3,
  activityCount: 14 + index * 4,
  mlRequestCount: 2 + (index % 5) * 2
}));

const recentActivity: ActivityLogItem[] = [
  {
    id: "activity-1",
    actorType: "USER",
    action: "EXPENSE_CREATED",
    feature: "manual_entry",
    description: "Aarav Sharma logged lunch and commute expenses",
    createdAt: hoursAgo(1),
    user: { id: "test-user-1", name: "Aarav Sharma", email: "aarav.sharma@testlab.app" }
  },
  {
    id: "activity-2",
    actorType: "USER",
    action: "SMS_IMPORT_COMPLETED",
    feature: "sms_parser",
    description: "Diya Patel imported 12 bank SMS transactions",
    createdAt: hoursAgo(2),
    user: { id: "test-user-2", name: "Diya Patel", email: "diya.patel@testlab.app" }
  },
  {
    id: "activity-3",
    actorType: "ADMIN",
    action: "ANALYTICS_VIEWED",
    feature: "admin_dashboard",
    description: "Admin reviewed conversion and system health panels",
    createdAt: hoursAgo(3),
    admin: { id: "admin-1", name: "Test Admin", email: "admin@testlab.app" }
  },
  {
    id: "activity-4",
    actorType: "USER",
    action: "BUDGET_UPDATED",
    feature: "budget",
    description: "Sara Khan adjusted weekly food budget",
    createdAt: hoursAgo(5),
    user: { id: "test-user-6", name: "Sara Khan", email: "sara.khan@testlab.app" }
  },
  {
    id: "activity-5",
    actorType: "SYSTEM",
    action: "DAILY_SCORE_REFRESH",
    feature: "finance_score",
    description: "Finance scores recalculated for all active users",
    createdAt: hoursAgo(8)
  },
  {
    id: "activity-6",
    actorType: "USER",
    action: "ML_PREDICTION_REQUESTED",
    feature: "receipt_classifier",
    description: "Myra Iyer classified a grocery transaction",
    createdAt: hoursAgo(10),
    user: { id: "test-user-10", name: "Myra Iyer", email: "myra.iyer@testlab.app" }
  },
  {
    id: "activity-7",
    actorType: "USER",
    action: "VOICE_ENTRY_CREATED",
    feature: "voice",
    description: "Kian Kapoor added a cab fare through voice input",
    createdAt: hoursAgo(12),
    user: { id: "test-user-15", name: "Kian Kapoor", email: "kian.kapoor@testlab.app" }
  },
  {
    id: "activity-8",
    actorType: "USER",
    action: "EXPENSE_CREATED",
    feature: "manual_entry",
    description: "Tara Menon logged pharmacy and rent expenses",
    createdAt: hoursAgo(16),
    user: { id: "test-user-20", name: "Tara Menon", email: "tara.menon@testlab.app" }
  }
];

const activityLogs: ActivityLogItem[] = [
  ...recentActivity,
  {
    id: "activity-9",
    actorType: "USER",
    action: "CASH_BALANCE_ADJUSTED",
    feature: "cash",
    description: "Kabir Mehta synced wallet balance after ATM withdrawal",
    createdAt: hoursAgo(18),
    user: { id: "test-user-7", name: "Kabir Mehta", email: "kabir.mehta@testlab.app" }
  },
  {
    id: "activity-10",
    actorType: "USER",
    action: "NOTIFICATION_OPENED",
    feature: "push_notifications",
    description: "Anaya Singh opened the spending alert notification",
    createdAt: hoursAgo(20),
    user: { id: "test-user-4", name: "Anaya Singh", email: "anaya.singh@testlab.app" }
  },
  {
    id: "activity-11",
    actorType: "ADMIN",
    action: "USER_EXPORT_TRIGGERED",
    feature: "admin_users",
    description: "Admin exported a temporary QA user report",
    createdAt: hoursAgo(22),
    admin: { id: "admin-1", name: "Test Admin", email: "admin@testlab.app" }
  },
  {
    id: "activity-12",
    actorType: "SYSTEM",
    action: "ML_HEALTH_CHECK",
    feature: "ml_service",
    description: "Background ML ping returned a healthy response",
    createdAt: hoursAgo(24)
  }
];

const mlLogs = [
  {
    id: "ml-1",
    requestType: "CATEGORY_PREDICTION",
    merchant: "Blinkit",
    category: "Groceries",
    success: true,
    responseTimeMs: 182,
    createdAt: hoursAgo(1)
  },
  {
    id: "ml-2",
    requestType: "SMS_PARSE",
    merchant: "Uber",
    category: "Transport",
    success: true,
    responseTimeMs: 236,
    createdAt: hoursAgo(2)
  },
  {
    id: "ml-3",
    requestType: "CATEGORY_PREDICTION",
    merchant: "Apollo Pharmacy",
    category: "Health",
    success: true,
    responseTimeMs: 164,
    createdAt: hoursAgo(4)
  },
  {
    id: "ml-4",
    requestType: "SMS_PARSE",
    merchant: "IRCTC",
    category: "Travel",
    success: false,
    responseTimeMs: 341,
    createdAt: hoursAgo(6)
  },
  {
    id: "ml-5",
    requestType: "CATEGORY_PREDICTION",
    merchant: "Swiggy",
    category: "Food",
    success: true,
    responseTimeMs: 193,
    createdAt: hoursAgo(8)
  },
  {
    id: "ml-6",
    requestType: "CATEGORY_PREDICTION",
    merchant: "Amazon",
    category: "Shopping",
    success: true,
    responseTimeMs: 208,
    createdAt: hoursAgo(11)
  }
];

const recentRequests = [
  { method: "GET", path: "/api/admin/overview", statusCode: 200, durationMs: 98, createdAt: hoursAgo(1) },
  { method: "GET", path: "/api/admin/users?page=1&limit=20", statusCode: 200, durationMs: 122, createdAt: hoursAgo(1.5) },
  { method: "GET", path: "/api/admin/activity?page=1&limit=25", statusCode: 200, durationMs: 117, createdAt: hoursAgo(2) },
  { method: "POST", path: "/api/ml/predict", statusCode: 200, durationMs: 186, createdAt: hoursAgo(3) },
  { method: "POST", path: "/api/expenses", statusCode: 201, durationMs: 144, createdAt: hoursAgo(3.5) },
  { method: "GET", path: "/api/admin/system", statusCode: 200, durationMs: 88, createdAt: hoursAgo(5) }
];

export const mockAdminOverview: AdminOverview = {
  stats: {
    totalUsers: 20,
    activeUsers: 17,
    totalExpenses: 246,
    smsImports: 64,
    mlPredictions: 91,
    conversionRate: 85
  },
  featureUsage: [
    { feature: "manual_entry", count: 92 },
    { feature: "sms_parser", count: 64 },
    { feature: "budget", count: 41 },
    { feature: "cash", count: 28 },
    { feature: "voice", count: 19 },
    { feature: "receipt_classifier", count: 33 }
  ],
  expenseCategories: [
    { category: "Food", totalAmount: 18450, count: 62 },
    { category: "Transport", totalAmount: 9720, count: 38 },
    { category: "Shopping", totalAmount: 14310, count: 31 },
    { category: "Bills", totalAmount: 12100, count: 24 },
    { category: "Health", totalAmount: 6890, count: 17 },
    { category: "Travel", totalAmount: 15840, count: 14 }
  ],
  activitySeries: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    activity: [42, 38, 51, 47, 56, 61, 49],
    expenses: [18, 22, 26, 24, 31, 29, 27],
    mlRequests: [9, 12, 15, 11, 17, 14, 13]
  },
  recentActivity
};

export const mockAdminUsersResponse: AdminUsersResponse = {
  success: true,
  users: adminUsers,
  meta: {
    total: adminUsers.length,
    page: 1,
    limit: 20
  }
};

export const mockAdminActivityResponse: AdminActivityResponse = {
  success: true,
  logs: activityLogs,
  summary: [
    { action: "EXPENSE_CREATED", count: 84 },
    { action: "SMS_IMPORT_COMPLETED", count: 29 },
    { action: "ML_PREDICTION_REQUESTED", count: 33 },
    { action: "BUDGET_UPDATED", count: 17 },
    { action: "VOICE_ENTRY_CREATED", count: 11 },
    { action: "CASH_BALANCE_ADJUSTED", count: 9 }
  ],
  meta: {
    total: activityLogs.length,
    page: 1,
    limit: 25
  }
};

export const mockAdminMlResponse: AdminMlResponse = {
  success: true,
  stats: {
    totalPredictions: 91,
    successRate: 94,
    averageResponseTimeMs: 204
  },
  categories: [
    { category: "Groceries", count: 19 },
    { category: "Food", count: 17 },
    { category: "Transport", count: 14 },
    { category: "Shopping", count: 13 },
    { category: "Bills", count: 11 },
    { category: "Health", count: 9 },
    { category: "Travel", count: 8 }
  ],
  logs: mlLogs,
  meta: {
    total: mlLogs.length,
    page: 1,
    limit: 25
  }
};

export const mockAdminSystemResponse: AdminSystemResponse = {
  success: true,
  system: {
    runtime: {
      uptimeSeconds: 172800,
      requestCount: 4821,
      errorCount: 23,
      averageResponseTimeMs: 126,
      p95ResponseTimeMs: 284,
      recentRequests
    },
    services: {
      database: {
        status: "healthy",
        responseTimeMs: 34
      },
      ml: {
        status: "healthy",
        responseTimeMs: 91
      }
    }
  }
};
