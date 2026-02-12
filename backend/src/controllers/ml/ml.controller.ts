import { NextFunction, Request, Response } from "express";
import {
  parseSmsAndPredict,
  predictMerchantCategory
} from "../../services/ml/ml.service";

export async function predictCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { merchant } = req.body;
    const result = await predictMerchantCategory(merchant);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return next(error);
  }
}

export async function parseSms(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { smsText } = req.body;
    const result = await parseSmsAndPredict(smsText);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return next(error);
  }
}
