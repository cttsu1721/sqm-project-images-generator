"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { ShowcaseGallery, ShowcaseImage } from "@/components/ShowcaseGallery";
import { GenerationProgress, GenerationStatus } from "@/components/GenerationProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JobPageProps {
  params: Promise<{ jobId: string }>;
}

interface JobData {
  prompt: string;
  suburb?: string;
  projectType?: string;
  status: string;
  progress: number;
  currentImage: number;
  totalImages: number;
  currentVariation?: string;
  message?: string;
  images: ShowcaseImage[];
  createdAt?: string;
}

export default function JobDetailPage({ params }: JobPageProps) {
  const { jobId } = use(params);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobData = useCallback(async () => {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      if (!response.ok) {
        throw new Error("Job not found");
      }
      const data = await response.json();

      setJobData({
        prompt: data.prompt,
        suburb: data.parsed?.suburb || data.suburb,
        projectType: data.parsed?.project_type,
        status: data.status,
        progress: data.progress || 0,
        currentImage: data.currentImage || 0,
        totalImages: data.totalImages || 18,
        currentVariation: data.currentVariation,
        message: data.message,
        images: data.images || [],
        createdAt: data.created_at,
      });
      setLoading(false);

      // Continue polling if job is in progress
      if (
        data.status !== "complete" &&
        data.status !== "error" &&
        data.status !== "idle"
      ) {
        setTimeout(() => fetchJobData(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  const handleDownloadAll = useCallback(async () => {
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
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [jobId]);

  const formatProjectType = (type: string | undefined) => {
    if (!type) return null;
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSuburb = (suburb: string | undefined) => {
    if (!suburb) return null;
    return suburb.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isGenerating =
    jobData &&
    jobData.status !== "idle" &&
    jobData.status !== "complete" &&
    jobData.status !== "error";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading job...</span>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Job Not Found
            </h2>
            <p className="text-red-600 mb-6">
              {error || "This job doesn't exist or has been deleted."}
            </p>
            <Link href="/history">
              <Button variant="outline">Back to History</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/history"
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
                Project Details
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {jobData.projectType && (
                <Badge variant="outline">
                  {formatProjectType(jobData.projectType)}
                </Badge>
              )}
              {jobData.suburb && (
                <Badge variant="secondary">{formatSuburb(jobData.suburb)}</Badge>
              )}
              {jobData.createdAt && (
                <span className="text-sm text-gray-500">
                  {formatDate(jobData.createdAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {jobData.status === "complete" && jobData.images.length > 0 && (
              <Button variant="outline" onClick={handleDownloadAll}>
                Download ZIP
              </Button>
            )}
            <Link href="/generate">
              <Button>New Project</Button>
            </Link>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Project Description
          </h3>
          <p className="text-gray-900">{jobData.prompt}</p>
        </div>

        {/* Progress Section */}
        {isGenerating && (
          <div className="mb-8">
            <GenerationProgress
              status={{
                status: jobData.status as GenerationStatus["status"],
                progress: jobData.progress,
                currentImage: jobData.currentImage,
                totalImages: jobData.totalImages,
                currentVariation: jobData.currentVariation,
                message: jobData.message,
              }}
            />
          </div>
        )}

        {/* Error Message */}
        {jobData.status === "error" && (
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
                <p className="text-sm text-red-600">{jobData.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Gallery */}
        {jobData.images.length > 0 && (
          <ShowcaseGallery
            images={jobData.images}
            projectInfo={{
              prompt: jobData.prompt,
              suburb: jobData.suburb,
              projectType: jobData.projectType,
            }}
            onDownloadAll={handleDownloadAll}
            jobId={jobId}
          />
        )}

        {/* Empty State */}
        {jobData.status === "complete" && jobData.images.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No images were generated for this job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
