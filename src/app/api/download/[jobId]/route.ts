import { NextRequest, NextResponse } from "next/server";
import { readFile, access, readdir } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";

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

    const jobDir = path.join(process.cwd(), OUTPUT_DIR, jobId);

    // Check if job directory exists
    try {
      await access(jobDir);
    } catch {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Get all PNG files in the directory
    const files = await readdir(jobDir);
    const imageFiles = files.filter(
      (f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg")
    );

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "No images found" },
        { status: 404 }
      );
    }

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 5 }, // Compression level
    });

    // Create a PassThrough stream to collect the archive data
    const chunks: Buffer[] = [];
    const passThrough = new PassThrough();

    passThrough.on("data", (chunk) => {
      chunks.push(chunk);
    });

    archive.pipe(passThrough);

    // Add image files to archive
    for (const file of imageFiles) {
      const filePath = path.join(jobDir, file);
      const fileContent = await readFile(filePath);
      archive.append(fileContent, { name: file });
    }

    // Add manifest if it exists
    const manifestPath = path.join(jobDir, "manifest.json");
    try {
      await access(manifestPath);
      const manifestContent = await readFile(manifestPath);
      archive.append(manifestContent, { name: "manifest.json" });
    } catch {
      // No manifest, that's ok
    }

    // Finalize the archive
    await archive.finalize();

    // Wait for all data to be collected
    await new Promise<void>((resolve) => {
      passThrough.on("end", resolve);
    });

    const zipBuffer = Buffer.concat(chunks);

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="showcase-package-${jobId}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 }
    );
  }
}
