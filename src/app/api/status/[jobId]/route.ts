import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";

// Helper to resolve directory paths - handles both absolute and relative paths
const resolveDir = (dir: string, ...segments: string[]) =>
  path.isAbsolute(dir)
    ? path.join(dir, ...segments)
    : path.join(process.cwd(), dir, ...segments);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const statusPath = resolveDir(OUTPUT_DIR, jobId, "status.json");

    // Check if status file exists
    try {
      await access(statusPath);
    } catch {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Read status file
    const statusContent = await readFile(statusPath, "utf-8");
    const status = JSON.parse(statusContent);

    // Also check for manifest to get images and project info
    const manifestPath = resolveDir(OUTPUT_DIR, jobId, "manifest.json");
    try {
      await access(manifestPath);
      const manifestContent = await readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(manifestContent);
      status.images = manifest.images || [];
      // Include parsed project info for showcase display
      if (manifest.parsed) {
        status.parsed = manifest.parsed;
      }
      if (manifest.suburb) {
        status.suburb = manifest.suburb;
      }
    } catch {
      // No manifest yet
      status.images = [];
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
