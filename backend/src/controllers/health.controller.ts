import { Request, Response } from "express";

export async function healthCheck(req: Request, res: Response) {
  return res.status(200).json({
    status: "OK",
    message: "Backend is healthy 🚀"
  });
}
