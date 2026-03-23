import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import prisma from "../../config/prisma";
import { recordUserActivity } from "../activity/activity.service";
import type { Request } from "express";

type MLRequestKind = "PREDICT_CATEGORY" | "PARSE_SMS";

type MLRequestOptions = {
  userId?: string;
  req?: Request;
  shouldLog?: boolean;
};

function resolveScriptPath() {
  const envPath = process.env.ML_SCRIPT_PATH;
  if (envPath) return envPath;

  const cwd = process.cwd();
  const candidate = path.resolve(cwd, "..", "ml", "api.py");
  return candidate;
}

function getPythonCmd() {
  if (process.env.ML_PYTHON_PATH) return process.env.ML_PYTHON_PATH;

  const cwd = process.cwd();
  const windowsVenv = path.resolve(cwd, "..", "ml", ".venv", "Scripts", "python.exe");
  if (fs.existsSync(windowsVenv)) return windowsVenv;

  const unixVenv = path.resolve(cwd, "..", "ml", ".venv", "bin", "python");
  if (fs.existsSync(unixVenv)) return unixVenv;

  return "python";
}

function runPython(args: string[]) {
  return new Promise<string>((resolve, reject) => {
    execFile(getPythonCmd(), args, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr || error.message);
      }
      return resolve(stdout.trim());
    });
  });
}

async function logMLRequest(input: {
  requestType: MLRequestKind;
  merchant?: string;
  category?: string;
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  rawResponse?: unknown;
  userId?: string;
}) {
  await prisma.mLLog.create({
    data: {
      requestType: input.requestType,
      merchant: input.merchant,
      category: input.category,
      success: input.success,
      responseTimeMs: input.responseTimeMs,
      errorMessage: input.errorMessage,
      rawResponse: input.rawResponse as any,
      userId: input.userId
    }
  });
}

export async function predictMerchantCategory(
  merchant: string,
  options: MLRequestOptions = {}
) {
  const script = resolveScriptPath();
  const startedAt = Date.now();

  try {
    const output = await runPython([script, "--merchant", merchant]);
    const parsed = JSON.parse(output);
    const responseTimeMs = Date.now() - startedAt;

    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PREDICT_CATEGORY",
        merchant,
        category: parsed.category,
        success: true,
        responseTimeMs,
        rawResponse: parsed,
        userId: options.userId
      });
    }

    return parsed;
  } catch (error) {
    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PREDICT_CATEGORY",
        merchant,
        success: false,
        responseTimeMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
        userId: options.userId
      });
    }
    throw error;
  }
}

export async function parseSmsAndPredict(
  smsText: string,
  options: MLRequestOptions = {}
) {
  const script = resolveScriptPath();
  const startedAt = Date.now();

  try {
    const output = await runPython([script, "--sms", smsText]);
    const parsed = JSON.parse(output);
    const responseTimeMs = Date.now() - startedAt;

    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PARSE_SMS",
        merchant: parsed.merchant,
        category: parsed.category,
        success: true,
        responseTimeMs,
        rawResponse: parsed,
        userId: options.userId
      });

      if (options.userId) {
        await recordUserActivity({
          userId: options.userId,
          action: "SMS_IMPORT",
          feature: "sms-parser",
          description: "Imported SMS for expense extraction",
          metadata: {
            merchant: parsed.merchant,
            category: parsed.category
          },
          req: options.req
        });
      }
    }

    return parsed;
  } catch (error) {
    if (options.shouldLog !== false) {
      await logMLRequest({
        requestType: "PARSE_SMS",
        success: false,
        responseTimeMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
        userId: options.userId
      });
    }
    throw error;
  }
}

export async function probeMlService() {
  const startedAt = Date.now();

  try {
    await predictMerchantCategory("Amazon", { shouldLog: false });
    return {
      status: "healthy",
      responseTimeMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTimeMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}
