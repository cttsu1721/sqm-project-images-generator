import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import path from "path";
import fs from "fs/promises";
import { ProjectReport } from "@/lib/pdf/ProjectReport";

interface ExportPdfParams {
  params: Promise<{
    jobId: string;
  }>;
}

// Convert local image file to base64 data URL
async function imageToDataUrl(imagePath: string): Promise<string> {
  try {
    const data = await fs.readFile(imagePath);
    const base64 = data.toString("base64");
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
    const mimeType = mimeTypes[ext] || "image/png";
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest, { params }: ExportPdfParams) {
  const { jobId } = await params;

  // Validate job exists
  const outputDir = path.join(process.cwd(), "generated-images", jobId);

  try {
    await fs.access(outputDir);
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Load manifest
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

  // Convert all image URLs to data URLs for PDF embedding
  const imagesWithDataUrls = await Promise.all(
    (manifest.images || []).map(
      async (image: { filename: string; url: string }) => {
        const imagePath = path.join(outputDir, image.filename);
        const dataUrl = await imageToDataUrl(imagePath);
        return {
          ...image,
          url: dataUrl || image.url, // Fallback to original URL if conversion fails
        };
      }
    )
  );

  // Prepare project info
  const projectInfo = {
    prompt: manifest.prompt || "No description provided",
    suburb: manifest.parsed?.suburb || manifest.suburb,
    projectType: manifest.parsed?.project_type,
  };

  try {
    // Create PDF buffer
    const pdfBuffer = await renderToBuffer(
      <ProjectReport
        images={imagesWithDataUrls}
        projectInfo={projectInfo}
        parsed={manifest.parsed}
        jobId={jobId}
        createdAt={manifest.created_at}
      />
    );

    // Format filename
    const suburb = manifest.parsed?.suburb || manifest.suburb || "project";
    const projectType = manifest.parsed?.project_type || "showcase";
    const filename = `${suburb}_${projectType}_${jobId.slice(0, 8)}.pdf`;

    // Return PDF - Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: String(error) },
      { status: 500 }
    );
  }
}
