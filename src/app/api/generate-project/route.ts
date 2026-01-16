import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import { randomUUID } from "crypto";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, projectType, suburb } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    if (prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt too short. Please provide more details." },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = randomUUID();

    // Create output directory
    const outputDir = path.join(process.cwd(), OUTPUT_DIR, jobId);
    await mkdir(outputDir, { recursive: true });

    // Create initial status file
    const statusPath = path.join(outputDir, "status.json");
    await writeFile(
      statusPath,
      JSON.stringify({
        status: "parsing",
        progress: 2,
        currentImage: 0,
        totalImages: 18,
        message: "Analyzing project description...",
        prompt: prompt,
        projectType: projectType || null,
        suburb: suburb || null,
        created_at: new Date().toISOString(),
      })
    );

    // Spawn Python generation script
    const agentPath = path.join(process.cwd(), "agent", "generate_project.py");
    // Use PYTHON_PATH env var (defaults to python3 if not set)
    const pythonPath = process.env.PYTHON_PATH || "python3";

    // Build CLI arguments
    const args = [agentPath, prompt, outputDir, jobId];
    if (projectType) {
      args.push("--project-type", projectType);
    }
    if (suburb) {
      args.push("--suburb", suburb);
    }

    const pythonProcess = spawn(
      pythonPath,
      args,
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), "agent"),
        },
        detached: true,
        stdio: "ignore",
      }
    );

    // Detach the process so it runs independently
    pythonProcess.unref();

    console.log(`Started project generation job ${jobId}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    if (projectType) console.log(`Project type: ${projectType}`);
    if (suburb) console.log(`Suburb: ${suburb}`);

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
