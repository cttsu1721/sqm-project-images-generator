import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function GET() {
  const checks: Record<string, boolean> = {
    server: true,
    python: false,
    storage: false,
  };

  // Check Python availability
  try {
    const pythonPath = process.env.PYTHON_PATH || "python3";
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(pythonPath, ["--version"]);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Python exit code: ${code}`));
      });
      proc.on("error", reject);
    });
    checks.python = true;
  } catch {
    checks.python = false;
  }

  // Check storage directories
  try {
    const outputDir = process.env.OUTPUT_DIR || "./generated-images";
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";

    await fs.access(path.resolve(outputDir));
    await fs.access(path.resolve(uploadDir));
    checks.storage = true;
  } catch {
    checks.storage = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
