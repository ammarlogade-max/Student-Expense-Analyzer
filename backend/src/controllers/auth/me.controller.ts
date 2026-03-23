import type { Response } from "express";
import prisma from "../../config/prisma";
import type { UserRequest } from "../../types/auth";

export async function getMe(req: UserRequest, res: Response) {
  try {
    const user = req.user;

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
        createdAt: true,
        lastActive: true,
        totalActions: true,
        deviceType: true
      }
    });

    return res.status(200).json({ user: me });
  } catch {
    return res.status(500).json({
      message: "Failed to fetch user"
    });
  }
}
