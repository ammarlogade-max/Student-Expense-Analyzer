import type { NextFunction, Response } from "express";
import {
  parseSmsAndPredict,
  predictMerchantCategory
} from "../../services/ml/ml.service";
import type { UserRequest } from "../../types/auth";

export async function predictCategory(
  req: UserRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { merchant } = req.body;
    const result = await predictMerchantCategory(merchant, {
      userId: req.user?.userId,
      req
    });
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return next(error);
  }
}

export async function parseSms(
  req: UserRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { smsText } = req.body;
    const result = await parseSmsAndPredict(smsText, {
      userId: req.user?.userId,
      req
    });
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return next(error);
  }
}
