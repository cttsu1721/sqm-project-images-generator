"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProjectPromptInput, GenerationParams } from "@/components/ProjectPromptInput";
import { GenerationProgress, GenerationStatus } from "@/components/GenerationProgress";
import { ShowcaseGallery, ShowcaseImage } from "@/components/ShowcaseGallery";
import { Button } from "@/components/ui/button";
import { Wand2, Upload } from "lucide-react";

export default function GeneratePage() {
  const [status, setStatus] = useState<GenerationStatus>({
    status: "idle",
    progress: 0,
    currentImage: 0,
    totalImages: 0,
  });
  const [generatedImages, setGeneratedImages] = useState<ShowcaseImage[]>([]);
  const [projectInfo, setProjectInfo] = useState<{
    prompt: string;
    suburb?: string;
    projectType?: string;
  } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleGenerate = useCallback(async (params: GenerationParams) => {
    const { prompt, projectType, suburb } = params;

    setGeneratedImages([]);
    setProjectInfo({ prompt, projectType, suburb });
    setStatus({
      status: "parsing",
      progress: 2,
      currentImage: 0,
      totalImages: 18,
      message: "Analyzing project description...",
    });

    try {
      const response = await fetch("/api/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectType, suburb }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const data = await response.json();
      setJobId(data.jobId);
      pollStatus(data.jobId);
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        status: "error",
        progress: 0,
        currentImage: 0,
        totalImages: 0,
        message: "Failed to start generation. Please try again.",
      });
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/status/${id}`);
        const data = await response.json();

        setStatus({
          status: data.status,
          progress: data.progress,
          currentImage: data.currentImage,
          totalImages: data.totalImages,
          currentVariation: data.currentVariation,
          message: data.message,
        });

        if (data.parsed) {
          setProjectInfo((prev) => ({
            ...prev!,
            suburb: data.parsed.suburb,
            projectType: data.parsed.project_type,
          }));
        }

        if (data.images) {
          setGeneratedImages(data.images);
        }

        if (data.status !== "complete" && data.status !== "error") {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll();
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/download/${jobId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `showcase-package-${jobId}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        generatedImages.forEach((image, index) => {
          setTimeout(() => {
            const a = document.createElement("a");
            a.href = image.url;
            a.download = image.filename;
            a.click();
          }, index * 300);
        });
      }
    } catch {
      generatedImages.forEach((image, index) => {
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = image.url;
          a.download = image.filename;
          a.click();
        }, index * 300);
      });
    }
  }, [jobId, generatedImages]);

  const handleRegenerateImage = useCallback(
    async (imageId: string) => {
      if (!jobId) return;

      const response = await fetch(`/api/regenerate/${jobId}/${imageId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Regeneration failed");
      }

      const statusResponse = await fetch(`/api/status/${jobId}`);
      const statusData = await statusResponse.json();
      if (statusData.images) {
        setGeneratedImages(statusData.images);
      }
    },
    [jobId]
  );

  const handleReset = () => {
    setStatus({
      status: "idle",
      progress: 0,
      currentImage: 0,
      totalImages: 0,
    });
    setGeneratedImages([]);
    setProjectInfo(null);
    setJobId(null);
  };

  const isGenerating =
    status.status !== "idle" &&
    status.status !== "complete" &&
    status.status !== "error";

  return (
    <AppShell>
      <PageHeader
        title="Generate Project"
        subtitle="Create a complete architect's showcase package from a text description. 18 photorealistic images covering hero shots, site context, features, interiors, and lifestyle."
        actions={
          status.status === "complete" ? (
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)] hover:border-[var(--sqm-green)]"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              New Project
            </Button>
          ) : undefined
        }
      />

      {/* Input Section */}
      {(status.status === "idle" || status.status === "error") && (
        <div className="mb-8">
          <ProjectPromptInput onGenerate={handleGenerate} disabled={isGenerating} />
        </div>
      )}

      {/* Progress Section */}
      {isGenerating && (
        <div className="mb-8">
          <GenerationProgress status={status} />
        </div>
      )}

      {/* Error Message */}
      {status.status === "error" && (
        <div className="mb-8 sqm-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--sqm-text-primary)]">
                Generation Failed
              </p>
              <p className="text-sm text-[var(--sqm-text-muted)]">
                {status.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Gallery */}
      {generatedImages.length > 0 && (
        <ShowcaseGallery
          images={generatedImages}
          projectInfo={projectInfo || undefined}
          onDownloadAll={handleDownloadAll}
          onRegenerateImage={handleRegenerateImage}
          jobId={jobId || undefined}
        />
      )}

      {/* How it Works Section */}
      {status.status === "idle" && generatedImages.length === 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-xl font-semibold text-[var(--sqm-text-primary)] mb-6">
            What You'll Get: Architect's Showcase Package
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                count: 3,
                title: "Hero Shots",
                description:
                  "Primary facade, twilight hero, and elevated drone view - the money shots for marketing.",
                color: "var(--sqm-green)",
              },
              {
                count: 3,
                title: "Site & Context",
                description:
                  "Street scene, aerial view, and pedestrian approach - critical for planning permits.",
                color: "var(--sqm-green-light)",
              },
              {
                count: 3,
                title: "Architectural Features",
                description:
                  "Entry threshold, material details, and signature element - showcase design quality.",
                color: "var(--sqm-gold)",
              },
              {
                count: 4,
                title: "Interior Spaces",
                description:
                  "Living, kitchen, master bedroom, and bathroom - show buyers the lifestyle.",
                color: "var(--sqm-green)",
              },
              {
                count: 3,
                title: "Spatial Experience",
                description:
                  "Staircase void, window moments, and volume shots - the wow factor.",
                color: "var(--sqm-green-light)",
              },
              {
                count: 2,
                title: "Lifestyle & Atmosphere",
                description:
                  "Morning light and evening entertaining - emotional connection for buyers.",
                color: "var(--sqm-gold)",
              },
            ].map((item) => (
              <div key={item.title} className="sqm-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <span
                      className="font-bold text-sm"
                      style={{ color: item.color }}
                    >
                      {item.count}
                    </span>
                  </div>
                  <h3 className="font-medium text-[var(--sqm-text-primary)]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--sqm-text-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 sqm-card p-6">
            <h3 className="font-medium text-[var(--sqm-text-primary)] mb-3">
              Melbourne Suburb Context
            </h3>
            <p className="text-sm text-[var(--sqm-text-muted)] mb-4">
              The generator recognizes 30+ Melbourne suburbs and applies
              appropriate visual context - trees, neighbours, street character,
              and finish levels.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Balwyn",
                "Balwyn North",
                "Camberwell",
                "Canterbury",
                "Doncaster",
                "Box Hill",
                "Templestowe",
                "Kew",
                "Glen Waverley",
                "Hawthorn",
                "Brighton",
                "Toorak",
              ].map((suburb) => (
                <span
                  key={suburb}
                  className="px-3 py-1 bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-secondary)] text-sm rounded-full border border-[var(--sqm-border)]"
                >
                  {suburb}
                </span>
              ))}
              <span className="px-3 py-1 bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-muted)] text-sm rounded-full border border-[var(--sqm-border)]">
                + 20 more
              </span>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
