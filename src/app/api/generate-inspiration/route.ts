import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { randomUUID } from "crypto";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";
const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inspirationFile = formData.get("inspirationImage") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const projectType = formData.get("projectType") as string | null;
    const suburb = formData.get("suburb") as string | null;

    if (!inspirationFile) {
      return NextResponse.json(
        { error: "No inspiration image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!inspirationFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = randomUUID();

    // Create directories
    const uploadsDir = path.join(process.cwd(), UPLOADS_DIR, jobId);
    const outputDir = path.join(process.cwd(), OUTPUT_DIR, jobId);
    await mkdir(uploadsDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    // Save inspiration image
    const timestamp = Date.now();
    const ext = inspirationFile.name.split(".").pop() || "png";
    const inspirationFilename = `inspiration_${timestamp}.${ext}`;
    const inspirationPath = path.join(uploadsDir, inspirationFilename);

    const bytes = await inspirationFile.arrayBuffer();
    await writeFile(inspirationPath, Buffer.from(bytes));

    // Create initial status file
    const statusPath = path.join(outputDir, "status.json");
    await writeFile(
      statusPath,
      JSON.stringify({
        status: "generating_inspiration_hero",
        progress: 2,
        currentImage: 0,
        totalImages: 18,
        flowType: "inspiration",
        message: "Analyzing inspiration style...",
        prompt: prompt || "",
        projectType: projectType || null,
        suburb: suburb || null,
        inspiration: {
          filename: inspirationFilename,
          uploadedAt: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })
    );

    // Spawn Python generation script
    const agentPath = path.join(
      process.cwd(),
      "agent",
      "generate_inspiration_hero.py"
    );
    const pythonPath = process.env.PYTHON_PATH || "python3";

    // Build CLI arguments
    const args = [agentPath, inspirationPath, outputDir, jobId];
    if (prompt) {
      args.push("--prompt", prompt);
    }
    if (projectType) {
      args.push("--project-type", projectType);
    }
    if (suburb) {
      args.push("--suburb", suburb);
    }

    const pythonProcess = spawn(pythonPath, args, {
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

    console.log(`Started inspiration-based hero generation job ${jobId}`);
    console.log(`Inspiration image: ${inspirationFilename}`);
    if (prompt) console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    if (projectType) console.log(`Project type: ${projectType}`);
    if (suburb) console.log(`Suburb: ${suburb}`);

    return NextResponse.json({
      success: true,
      jobId,
      message: "Inspiration-based hero generation started",
    });
  } catch (error) {
    console.error("Inspiration generation error:", error);
    return NextResponse.json(
      { error: "Failed to start inspiration-based generation" },
      { status: 500 }
    );
  }
}
