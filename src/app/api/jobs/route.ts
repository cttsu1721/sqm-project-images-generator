import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";

export interface JobSummary {
  jobId: string;
  prompt: string;
  projectType: string | null;
  suburb: string | null;
  imageCount: number;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: string;
}

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), OUTPUT_DIR);

    let dirs: string[];
    try {
      dirs = await readdir(baseDir);
    } catch {
      // Directory doesn't exist yet
      return NextResponse.json({ jobs: [] });
    }

    const jobs = await Promise.all(
      dirs.map(async (jobId): Promise<JobSummary | null> => {
        try {
          const jobDir = path.join(baseDir, jobId);
          const jobStat = await stat(jobDir);

          if (!jobStat.isDirectory()) return null;

          // Try to read manifest first (more complete), fall back to status
          let manifest: Record<string, unknown> | null = null;
          let status: Record<string, unknown> | null = null;

          try {
            const manifestPath = path.join(jobDir, "manifest.json");
            manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
          } catch {
            // Manifest doesn't exist yet (job in progress)
          }

          try {
            const statusPath = path.join(jobDir, "status.json");
            status = JSON.parse(await readFile(statusPath, "utf-8"));
          } catch {
            // Status doesn't exist
          }

          if (!manifest && !status) return null;

          // Get thumbnail (first hero image)
          const images = (manifest?.images as Array<Record<string, unknown>>) || [];
          const heroImage = images.find((img) => img.isHero);

          return {
            jobId,
            prompt: (manifest?.prompt || status?.prompt || "") as string,
            projectType:
              ((manifest?.parsed as Record<string, unknown>)?.project_type as string) ||
              (status?.projectType as string) ||
              null,
            suburb: (manifest?.suburb || status?.suburb || null) as string | null,
            imageCount: images.length,
            thumbnail: heroImage ? (heroImage.url as string) : null,
            createdAt: (manifest?.created_at || status?.created_at || "") as string,
            updatedAt: (manifest?.updated_at || status?.updated_at || null) as string | null,
            status: (status?.status || "unknown") as string,
          };
        } catch (error) {
          console.error(`Error reading job ${jobId}:`, error);
          return null;
        }
      })
    );

    // Filter nulls and sort by date descending
    const validJobs = jobs
      .filter((job): job is JobSummary => job !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ jobs: validJobs });
  } catch (error) {
    console.error("Error listing jobs:", error);
    return NextResponse.json({ jobs: [] });
  }
}
