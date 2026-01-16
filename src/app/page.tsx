"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProjectPromptInput, GenerationParams } from "@/components/ProjectPromptInput";
import { InspirationUploader, InspirationParams } from "@/components/InspirationUploader";
import { HeroApproval } from "@/components/HeroApproval";
import { GenerationProgress, GenerationStatus } from "@/components/GenerationProgress";
import { ShowcaseGallery, ShowcaseImage } from "@/components/ShowcaseGallery";
import { Button } from "@/components/ui/button";
import { Wand2, ImageIcon, Type } from "lucide-react";

type FlowType = "text" | "inspiration";

interface InspirationData {
  imagePath: string;
  styleAnalysis?: Record<string, unknown>;
}

interface HeroData {
  imagePath: string;
  filename: string;
}

export default function GeneratePage() {
  const [flowType, setFlowType] = useState<FlowType>("text");
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
  const [inspirationData, setInspirationData] = useState<InspirationData | null>(null);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [isApprovalLoading, setIsApprovalLoading] = useState(false);

  // Text prompt generation handler
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
      flowType: "text",
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

  // Inspiration-based generation handler
  const handleInspirationGenerate = useCallback(async (params: InspirationParams) => {
    const { inspirationImage, prompt, projectType, suburb } = params;

    setGeneratedImages([]);
    setInspirationData(null);
    setHeroData(null);
    setProjectInfo({ prompt: prompt || "", projectType, suburb });
    setStatus({
      status: "generating_inspiration_hero",
      progress: 2,
      currentImage: 0,
      totalImages: 18,
      message: "Analyzing inspiration style...",
      flowType: "inspiration",
    });

    try {
      const formData = new FormData();
      formData.append("inspirationImage", inspirationImage);
      if (prompt) formData.append("prompt", prompt);
      if (projectType) formData.append("projectType", projectType);
      if (suburb) formData.append("suburb", suburb);

      const response = await fetch("/api/generate-inspiration", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to start inspiration-based generation");
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
        message: "Failed to start inspiration-based generation. Please try again.",
      });
    }
  }, []);

  // Polling function that handles both flows
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
          flowType: data.flowType,
        });

        if (data.parsed) {
          setProjectInfo((prev) => ({
            ...prev!,
            suburb: data.parsed.suburb,
            projectType: data.parsed.project_type,
          }));
        }

        // Handle inspiration flow data
        if (data.inspiration) {
          setInspirationData({
            imagePath: data.inspiration.imagePath,
            styleAnalysis: data.inspiration.styleAnalysis,
          });
        }

        if (data.hero) {
          setHeroData({
            imagePath: data.hero.imagePath,
            filename: data.hero.filename,
          });
        }

        if (data.images) {
          setGeneratedImages(data.images);
        }

        // Continue polling for active statuses
        const activeStatuses = [
          "parsing",
          "analyzing",
          "generating_hero",
          "generating",
          "verifying",
          "generating_inspiration_hero",
          "regenerating_hero",
        ];

        if (activeStatuses.includes(data.status)) {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll();
  }, []);

  // Approval handlers
  const handleApproveHero = useCallback(async () => {
    if (!jobId) return;

    setIsApprovalLoading(true);
    try {
      const response = await fetch(`/api/approve-hero/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve hero");
      }

      // Resume polling
      pollStatus(jobId);
    } catch (error) {
      console.error("Approval error:", error);
      setStatus({
        status: "error",
        progress: 0,
        currentImage: 0,
        totalImages: 0,
        message: "Failed to approve hero. Please try again.",
      });
    } finally {
      setIsApprovalLoading(false);
    }
  }, [jobId, pollStatus]);

  const handleRejectHero = useCallback(async () => {
    if (!jobId) return;

    setIsApprovalLoading(true);
    try {
      const response = await fetch(`/api/approve-hero/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject hero");
      }

      // Reset to idle state
      handleReset();
    } catch (error) {
      console.error("Rejection error:", error);
    } finally {
      setIsApprovalLoading(false);
    }
  }, [jobId]);

  const handleRegenerateHero = useCallback(async (feedback: string) => {
    if (!jobId) return;

    setIsApprovalLoading(true);
    try {
      const response = await fetch(`/api/approve-hero/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", feedback }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate hero");
      }

      // Resume polling
      pollStatus(jobId);
    } catch (error) {
      console.error("Regeneration error:", error);
      setStatus({
        status: "error",
        progress: 0,
        currentImage: 0,
        totalImages: 0,
        message: "Failed to regenerate hero. Please try again.",
      });
    } finally {
      setIsApprovalLoading(false);
    }
  }, [jobId, pollStatus]);

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
    setInspirationData(null);
    setHeroData(null);
    setIsApprovalLoading(false);
  };

  const isGenerating =
    status.status !== "idle" &&
    status.status !== "complete" &&
    status.status !== "error" &&
    status.status !== "awaiting_approval" &&
    status.status !== "rejected";

  const showInput = status.status === "idle" || status.status === "error" || status.status === "rejected";
  const showApproval = status.status === "awaiting_approval" && heroData && inspirationData;

  return (
    <AppShell>
      <PageHeader
        title="Generate Project"
        subtitle="Create a complete architect's showcase package. 18 photorealistic images covering hero shots, site context, features, interiors, and lifestyle."
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

      {/* Flow Type Toggle - only show when idle */}
      {showInput && (
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-[var(--sqm-border-light)] p-1 bg-[var(--sqm-bg-elevated)]">
            <button
              onClick={() => setFlowType("text")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                flowType === "text"
                  ? "bg-[var(--sqm-green)] text-white"
                  : "text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)]"
              }`}
            >
              <Type className="w-4 h-4" />
              Text Prompt
            </button>
            <button
              onClick={() => setFlowType("inspiration")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                flowType === "inspiration"
                  ? "bg-[var(--sqm-green)] text-white"
                  : "text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)]"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Inspiration Image
            </button>
          </div>
        </div>
      )}

      {/* Input Section */}
      {showInput && (
        <div className="mb-8">
          {flowType === "text" ? (
            <ProjectPromptInput onGenerate={handleGenerate} disabled={isGenerating} />
          ) : (
            <InspirationUploader onGenerate={handleInspirationGenerate} disabled={isGenerating} />
          )}
        </div>
      )}

      {/* Hero Approval Section */}
      {showApproval && (
        <div className="mb-8">
          <HeroApproval
            jobId={jobId!}
            inspirationImagePath={inspirationData.imagePath}
            heroImagePath={heroData.imagePath}
            styleAnalysis={inspirationData.styleAnalysis as Record<string, unknown> | undefined}
            onApprove={handleApproveHero}
            onReject={handleRejectHero}
            onRegenerate={handleRegenerateHero}
            isLoading={isApprovalLoading}
          />
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

      {/* Rejected Message */}
      {status.status === "rejected" && (
        <div className="mb-8 sqm-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--sqm-text-primary)]">
                Hero Rejected
              </p>
              <p className="text-sm text-[var(--sqm-text-muted)]">
                Try uploading a different inspiration image to generate a new hero.
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
