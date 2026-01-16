import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";

// Helper to resolve directory paths - handles both absolute and relative paths
const resolveDir = (dir: string, ...segments: string[]) =>
  path.isAbsolute(dir)
    ? path.join(dir, ...segments)
    : path.join(process.cwd(), dir, ...segments);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = randomUUID();

    // Create upload directory
    const uploadDir = resolveDir(UPLOAD_DIR, jobId);
    await mkdir(uploadDir, { recursive: true });

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `hero_${Date.now()}.${file.name.split(".").pop()}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Create output directory
    const outputDir = resolveDir(OUTPUT_DIR, jobId);
    await mkdir(outputDir, { recursive: true });

    // Create initial status file
    const statusPath = path.join(outputDir, "status.json");
    await writeFile(
      statusPath,
      JSON.stringify({
        status: "analyzing",
        progress: 5,
        currentImage: 0,
        totalImages: 8,
        message: "Starting generation...",
        created_at: new Date().toISOString(),
      })
    );

    // Spawn Python generation script
    const agentPath = path.join(process.cwd(), "agent", "generate_images.py");
    // Use PYTHON_PATH env var (defaults to python3 if not set)
    const pythonPath = process.env.PYTHON_PATH || "python3";
    const pythonProcess = spawn(pythonPath, [agentPath, filepath, outputDir, jobId], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), "agent"),
      },
      detached: true,
      stdio: "ignore",
    });

    // Detach the process so it runs independently
    pythonProcess.unref();

    console.log(`Started generation job ${jobId} for image ${filename}`);

    return NextResponse.json({
      success: true,
      jobId,
      message: "Generation started",
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 }
    );
  }
}
