"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ImageUploader } from "@/components/ImageUploader";
import { GenerationProgress, GenerationStatus } from "@/components/GenerationProgress";
import { ImageGallery, GeneratedImage } from "@/components/ImageGallery";

export default function Home() {
  const [status, setStatus] = useState<GenerationStatus>({
    status: "idle",
    progress: 0,
    currentImage: 0,
    totalImages: 0,
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleImageSelect = useCallback(async (file: File) => {
    // Reset state
    setGeneratedImages([]);
    setStatus({
      status: "analyzing",
      progress: 5,
      currentImage: 0,
      totalImages: 8,
      message: "Extracting architectural features from hero image...",
    });

    // Create form data and upload
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
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

  const handleDownloadAll = useCallback(() => {
    generatedImages.forEach((image, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = image.url;
        a.download = `variation_${index + 1}_${image.variationType}.png`;
        a.click();
      }, index * 500);
    });
  }, [generatedImages]);

  const handleRegenerate = useCallback(async (imageId: string) => {
    // TODO: Implement single image regeneration
    console.log("Regenerate image:", imageId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SQM Project Images Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Upload a hero project image and generate consistent architectural
            variations from different angles, lighting conditions, and environments.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/generate"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate from Text Prompt
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              View History
            </Link>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <ImageUploader
            onImageSelect={handleImageSelect}
            disabled={status.status !== "idle" && status.status !== "complete" && status.status !== "error"}
          />
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <GenerationProgress status={status} />
        </div>

        {/* Results Gallery */}
        <ImageGallery
          images={generatedImages}
          onDownloadAll={generatedImages.length > 0 ? handleDownloadAll : undefined}
          onRegenerate={handleRegenerate}
        />

        {/* Info Section */}
        {status.status === "idle" && generatedImages.length === 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Upload Hero Image</h3>
                <p className="text-sm text-gray-600">
                  Drop your featured project image. The AI will analyze its
                  architectural features.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">AI Generation</h3>
                <p className="text-sm text-gray-600">
                  Gemini 3 Pro generates 6-10 variations from different angles
                  and conditions.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Quality Verification</h3>
                <p className="text-sm text-gray-600">
                  Each image is verified for consistency (&gt;80% score required).
                  Failed images are auto-regenerated.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
