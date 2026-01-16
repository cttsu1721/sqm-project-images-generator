"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ProjectPromptInput, GenerationParams } from "@/components/ProjectPromptInput";
import { GenerationProgress, GenerationStatus } from "@/components/GenerationProgress";
import { ShowcaseGallery, ShowcaseImage } from "@/components/ShowcaseGallery";
import { Button } from "@/components/ui/button";

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

    // Reset state
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, projectType, suburb }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const data = await response.json();
      setJobId(data.jobId);

      // Start polling for status
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

        // Update project info from manifest
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

    // Create a zip file of all images
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
        // Fallback: download individually
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
      // Fallback: download individually
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

  const handleRegenerateImage = useCallback(async (imageId: string) => {
    if (!jobId) return;

    const response = await fetch(`/api/regenerate/${jobId}/${imageId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Regeneration failed");
    }

    // Refresh images from status endpoint
    const statusResponse = await fetch(`/api/status/${jobId}`);
    const statusData = await statusResponse.json();
    if (statusData.images) {
      setGeneratedImages(statusData.images);
    }
  }, [jobId]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Project Generator
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl">
              Generate a complete architect's showcase package from a text
              description. 18 photorealistic images covering hero shots, site
              context, features, interiors, and lifestyle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/history">
              <Button variant="outline">View History</Button>
            </Link>
            {status.status === "complete" && (
              <Button variant="outline" onClick={handleReset}>
                Start New Project
              </Button>
            )}
          </div>
        </div>

        {/* Input Section - only show when idle or error */}
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
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-500"
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
              <div>
                <p className="font-medium text-red-800">Generation Failed</p>
                <p className="text-sm text-red-600">{status.message}</p>
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

        {/* Info Section - only show when idle and no results */}
        {status.status === "idle" && generatedImages.length === 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-6">
              What You'll Get: Architect's Showcase Package
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <h3 className="font-medium">Hero Shots</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Primary facade, twilight hero, and elevated drone view - the
                  money shots for marketing.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <h3 className="font-medium">Site & Context</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Street scene, aerial view, and pedestrian approach - critical
                  for planning permits.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <h3 className="font-medium">Architectural Features</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Entry threshold, material details, and signature element -
                  showcase design quality.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">4</span>
                  </div>
                  <h3 className="font-medium">Interior Spaces</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Living, kitchen, master bedroom, and bathroom - show buyers
                  the lifestyle.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <span className="text-pink-600 font-bold text-sm">3</span>
                  </div>
                  <h3 className="font-medium">Spatial Experience</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Staircase void, window moments, and volume shots - the wow
                  factor.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">2</span>
                  </div>
                  <h3 className="font-medium">Lifestyle & Atmosphere</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Morning light and evening entertaining - emotional connection
                  for buyers.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-medium mb-3">Melbourne Suburb Context</h3>
              <p className="text-sm text-gray-600 mb-4">
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
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {suburb}
                  </span>
                ))}
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                  + 20 more
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
