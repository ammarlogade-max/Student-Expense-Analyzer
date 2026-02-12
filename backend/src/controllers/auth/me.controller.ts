import { Request, Response } from "express";
import prisma from "../../config/prisma";

export async function getMe(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const me = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return res.status(200).json({ user: me });
  } catch {
    return res.status(500).json({
      message: "Failed to fetch user"
    });
  }
}
