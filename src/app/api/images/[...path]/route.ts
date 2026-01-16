import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // Construct file path from segments
    const filePath = path.join(process.cwd(), OUTPUT_DIR, ...pathSegments);

    // Security: Ensure path is within OUTPUT_DIR
    const normalizedPath = path.normalize(filePath);
    const outputDirPath = path.join(process.cwd(), OUTPUT_DIR);
    if (!normalizedPath.startsWith(outputDirPath)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await access(filePath);
    } catch {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Read and return the image
    const imageBuffer = await readFile(filePath);

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image serving error:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
