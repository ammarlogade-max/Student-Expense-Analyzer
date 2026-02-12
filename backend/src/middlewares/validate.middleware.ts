import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type SchemaBundle = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: SchemaBundle) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      return next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error?.errors?.[0]?.message || "Validation error"
      });
    }
  };
}
