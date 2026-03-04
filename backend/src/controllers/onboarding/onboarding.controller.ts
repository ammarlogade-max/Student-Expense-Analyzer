import { Request, Response } from "express";
import prisma from "../../config/prisma";

function getUserId(req: Request): string {
  const user = (req as Request & { user?: { userId: string } }).user;
  return user?.userId ?? "";
}

function isOnboardingSchemaError(error: unknown): boolean {
  const err = error as { code?: string; meta?: { column?: string } };
  const missingColumn = String(err?.meta?.column ?? "");
  return err?.code === "P2022" || missingColumn.includes("onboarding");
}

export async function getOnboardingStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingDone: true,
        college: true,
        yearOfStudy: true,
        city: true,
        monthlyAllowance: true,
        budgetSplit: true,
        name: true
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ onboardingDone: user.onboardingDone, profile: user });
  } catch (err) {
    console.error("getOnboardingStatus error:", err);
    if (isOnboardingSchemaError(err)) {
      return res.status(500).json({
        error: "Onboarding fields are not available in database. Run Prisma migration: npx prisma migrate dev"
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function completeOnboarding(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      college,
      yearOfStudy,
      city,
      monthlyAllowance,
      budgetSplit
    }: {
      college: string;
      yearOfStudy: number;
      city: string;
      monthlyAllowance: number;
      budgetSplit: Record<string, number>;
    } = req.body;

    if (!college?.trim()) {
      return res.status(400).json({ error: "College name is required" });
    }
    if (!monthlyAllowance || monthlyAllowance <= 0) {
      return res.status(400).json({ error: "Valid monthly allowance required" });
    }

    if (budgetSplit) {
      const total = Object.values(budgetSplit).reduce((s, v) => s + v, 0);
      if (Math.abs(total - 100) > 2) {
        return res.status(400).json({ error: "Budget split must sum to 100%" });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        college: college.trim(),
        yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,
        city: city?.trim() || null,
        monthlyAllowance: Number(monthlyAllowance),
        budgetSplit: budgetSplit || null,
        onboardingDone: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        college: true,
        yearOfStudy: true,
        city: true,
        monthlyAllowance: true,
        budgetSplit: true,
        onboardingDone: true
      }
    });

    // Keep Budget module in sync with onboarding so Budget page is immediately populated.
    const monthlyLimit = Number(monthlyAllowance);
    const categoryBudgets =
      budgetSplit && monthlyLimit > 0
        ? Object.fromEntries(
            Object.entries(budgetSplit).map(([category, pct]) => [
              category,
              Math.round((Number(pct) / 100) * monthlyLimit),
            ])
          )
        : {};

    await prisma.budget.upsert({
      where: { userId },
      update: {
        monthlyLimit,
        categoryBudgets,
      },
      create: {
        userId,
        monthlyLimit,
        categoryBudgets,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("completeOnboarding error:", err);
    if (isOnboardingSchemaError(err)) {
      return res.status(500).json({
        error: "Onboarding fields are not available in database. Run Prisma migration: npx prisma migrate dev"
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { college, yearOfStudy, city, monthlyAllowance } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(college !== undefined && { college: college.trim() }),
        ...(yearOfStudy !== undefined && { yearOfStudy: Number(yearOfStudy) }),
        ...(city !== undefined && { city: city.trim() }),
        ...(monthlyAllowance !== undefined && { monthlyAllowance: Number(monthlyAllowance) })
      },
      select: {
        id: true,
        name: true,
        email: true,
        college: true,
        yearOfStudy: true,
        city: true,
        monthlyAllowance: true,
        onboardingDone: true
      }
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("updateProfile error:", err);
    if (isOnboardingSchemaError(err)) {
      return res.status(500).json({
        error: "Onboarding fields are not available in database. Run Prisma migration: npx prisma migrate dev"
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
