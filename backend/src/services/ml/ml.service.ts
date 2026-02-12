import { execFile } from "child_process";
import fs from "fs";
import path from "path";

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

export async function predictMerchantCategory(merchant: string) {
  const script = resolveScriptPath();
  const output = await runPython([script, "--merchant", merchant]);
  return JSON.parse(output);
}

export async function parseSmsAndPredict(smsText: string) {
  const script = resolveScriptPath();
  const output = await runPython([script, "--sms", smsText]);
  return JSON.parse(output);
}
