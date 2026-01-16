import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, access } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Helper to resolve directory paths - handles both absolute and relative paths
const resolveDir = (dir: string, ...segments: string[]) =>
  path.isAbsolute(dir)
    ? path.join(dir, ...segments)
    : path.join(process.cwd(), dir, ...segments);

interface ApprovalRequest {
  action: "approve" | "reject" | "regenerate";
  feedback?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body: ApprovalRequest = await request.json();
    const { action, feedback } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject", "regenerate"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'regenerate'" },
        { status: 400 }
      );
    }

    const outputDir = resolveDir(OUTPUT_DIR, jobId);
    const statusPath = path.join(outputDir, "status.json");
    const manifestPath = path.join(outputDir, "manifest.json");

    // Check if job exists
    try {
      await access(statusPath);
    } catch {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Read current status
    const statusContent = await readFile(statusPath, "utf-8");
    const status = JSON.parse(statusContent);

    // Verify job is awaiting approval
    if (status.status !== "awaiting_approval") {
      return NextResponse.json(
        { error: `Job is not awaiting approval. Current status: ${status.status}` },
        { status: 400 }
      );
    }

    // Read manifest for hero info
    let manifest;
    try {
      const manifestContent = await readFile(manifestPath, "utf-8");
      manifest = JSON.parse(manifestContent);
    } catch {
      return NextResponse.json(
        { error: "Job manifest not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        // Update status to generating and continue with full generation
        const updatedStatus = {
          ...status,
          status: "generating",
          progress: 12,
          message: "Hero approved - generating remaining showcase images...",
          approvedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await writeFile(statusPath, JSON.stringify(updatedStatus, null, 2));

        // Update manifest with approval
        manifest.approvedAt = new Date().toISOString();
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

        // Get hero path from manifest
        const heroFilename = manifest.hero?.filename;
        if (!heroFilename) {
          return NextResponse.json(
            { error: "Hero image not found in manifest" },
            { status: 400 }
          );
        }

        const heroPath = path.join(outputDir, heroFilename);

        // Get parsed data from manifest
        const parsed = manifest.parsed || {};
        const suburb = manifest.suburb || parsed.suburb || "balwyn";
        const projectType = parsed.project_type || "dual_occupancy";
        const prompt = manifest.prompt || "";

        // Get style analysis from manifest for consistency
        const styleAnalysisPath = path.join(outputDir, "style_analysis.json");
        if (manifest.inspiration?.styleAnalysis) {
          await writeFile(
            styleAnalysisPath,
            JSON.stringify(manifest.inspiration.styleAnalysis, null, 2)
          );
        }

        // Spawn generate_project.py with --from-hero flag
        const agentPath = path.join(
          process.cwd(),
          "agent",
          "generate_project.py"
        );
        const pythonPath = process.env.PYTHON_PATH || "python3";

        const args = [
          agentPath,
          prompt || `${projectType.replace("_", " ")} development`,
          outputDir,
          jobId,
          "--from-hero",
          heroPath,
        ];

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

        pythonProcess.unref();

        console.log(`Approved hero for job ${jobId}, continuing generation`);

        return NextResponse.json({
          success: true,
          message: "Hero approved, generating remaining images",
          status: "generating",
        });
      }

      case "reject": {
        // Update status to rejected
        const updatedStatus = {
          ...status,
          status: "rejected",
          progress: 0,
          message: "Hero rejected - please try with different inspiration",
          rejectedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await writeFile(statusPath, JSON.stringify(updatedStatus, null, 2));

        console.log(`Rejected hero for job ${jobId}`);

        return NextResponse.json({
          success: true,
          message: "Hero rejected",
          status: "rejected",
        });
      }

      case "regenerate": {
        if (!feedback) {
          return NextResponse.json(
            { error: "Feedback is required for regeneration" },
            { status: 400 }
          );
        }

        // Update status to regenerating
        const updatedStatus = {
          ...status,
          status: "regenerating_hero",
          progress: 5,
          message: "Regenerating hero with your feedback...",
          regenerationFeedback: feedback,
          regenerationAttempt: (status.regenerationAttempt || 0) + 1,
          updated_at: new Date().toISOString(),
        };
        await writeFile(statusPath, JSON.stringify(updatedStatus, null, 2));

        // Get original inspiration path from uploads
        const uploadsDir = resolveDir(UPLOAD_DIR, jobId);
        const inspirationFilename = manifest.inspiration?.filename || status.inspiration?.filename;

        if (!inspirationFilename) {
          return NextResponse.json(
            { error: "Original inspiration image not found" },
            { status: 400 }
          );
        }

        // Try to find inspiration in uploads or output dir
        let inspirationPath = path.join(uploadsDir, inspirationFilename);
        try {
          await access(inspirationPath);
        } catch {
          // Try output dir
          inspirationPath = path.join(outputDir, inspirationFilename);
          try {
            await access(inspirationPath);
          } catch {
            return NextResponse.json(
              { error: "Inspiration image file not found" },
              { status: 404 }
            );
          }
        }

        // Get parsed data
        const parsed = manifest.parsed || {};
        const suburb = manifest.suburb || parsed.suburb || "balwyn";
        const projectType = parsed.project_type || "dual_occupancy";
        const prompt = manifest.prompt || "";

        // Spawn regeneration script
        const agentPath = path.join(
          process.cwd(),
          "agent",
          "generate_inspiration_hero.py"
        );
        const pythonPath = process.env.PYTHON_PATH || "python3";

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
        args.push("--feedback", feedback);

        const pythonProcess = spawn(pythonPath, args, {
          cwd: process.cwd(),
          env: {
            ...process.env,
            PYTHONPATH: path.join(process.cwd(), "agent"),
          },
          detached: true,
          stdio: "ignore",
        });

        pythonProcess.unref();

        console.log(`Regenerating hero for job ${jobId} with feedback: ${feedback.substring(0, 100)}...`);

        return NextResponse.json({
          success: true,
          message: "Regenerating hero with your feedback",
          status: "regenerating_hero",
        });
      }
    }
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
