import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

interface RegenerateParams {
  params: Promise<{
    jobId: string;
    imageId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RegenerateParams) {
  const { jobId, imageId } = await params;

  // Validate job exists
  const outputDir = path.join(process.cwd(), "generated-images", jobId);

  try {
    await fs.access(outputDir);
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Load manifest to get variation type
  const manifestPath = path.join(outputDir, "manifest.json");
  let manifest;
  try {
    const manifestData = await fs.readFile(manifestPath, "utf-8");
    manifest = JSON.parse(manifestData);
  } catch {
    return NextResponse.json(
      { error: "Manifest not found" },
      { status: 404 }
    );
  }

  // Find the image to regenerate
  const imageToRegenerate = manifest.images?.find(
    (img: { id: string }) => img.id === imageId
  );

  if (!imageToRegenerate) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Don't allow regenerating hero image
  if (imageToRegenerate.isHero) {
    return NextResponse.json(
      { error: "Cannot regenerate hero image" },
      { status: 400 }
    );
  }

  const variationType = imageToRegenerate.variationType;

  // Spawn regenerate_single.py
  const agentPath = path.join(process.cwd(), "agent", "regenerate_single.py");

  return new Promise<Response>((resolve) => {
    const pythonProcess = spawn("python3", [
      agentPath,
      jobId,
      variationType,
      outputDir,
    ]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log(`[regenerate ${variationType}]`, data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error(`[regenerate ${variationType} error]`, data.toString());
    });

    pythonProcess.on("close", async (code) => {
      if (code === 0) {
        // Reload manifest to get updated image
        try {
          const updatedManifestData = await fs.readFile(manifestPath, "utf-8");
          const updatedManifest = JSON.parse(updatedManifestData);

          // Find the regenerated image
          const newImage = updatedManifest.images?.find(
            (img: { variationType: string }) =>
              img.variationType === variationType
          );

          resolve(
            NextResponse.json({
              success: true,
              image: newImage,
              message: `Regenerated ${variationType}`,
            })
          );
        } catch {
          resolve(
            NextResponse.json({
              success: true,
              message: `Regenerated ${variationType}`,
            })
          );
        }
      } else {
        resolve(
          NextResponse.json(
            {
              error: "Regeneration failed",
              details: stderr || stdout,
            },
            { status: 500 }
          )
        );
      }
    });

    pythonProcess.on("error", (err) => {
      resolve(
        NextResponse.json(
          {
            error: "Failed to start regeneration process",
            details: err.message,
          },
          { status: 500 }
        )
      );
    });
  });
}
