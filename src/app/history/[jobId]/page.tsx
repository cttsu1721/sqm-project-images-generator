"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ShowcaseGallery, ShowcaseImage } from "@/components/ShowcaseGallery";
import { GenerationProgress, GenerationStatus } from "@/components/GenerationProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

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
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[var(--sqm-green)] animate-spin" />
          <span className="ml-3 text-[var(--sqm-text-muted)]">Loading job...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !jobData) {
    return (
      <AppShell>
        <div className="sqm-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-[var(--sqm-text-primary)] mb-2">
            Job Not Found
          </h2>
          <p className="text-[var(--sqm-text-muted)] mb-6">
            {error || "This job doesn't exist or has been deleted."}
          </p>
          <Link href="/history">
            <Button
              variant="outline"
              className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Project Details"
        subtitle={
          <div className="flex items-center gap-3 flex-wrap mt-2">
            {jobData.projectType && (
              <Badge
                variant="outline"
                className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)]"
              >
                {formatProjectType(jobData.projectType)}
              </Badge>
            )}
            {jobData.suburb && (
              <Badge className="bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-secondary)] border border-[var(--sqm-border)]">
                {formatSuburb(jobData.suburb)}
              </Badge>
            )}
            {jobData.createdAt && (
              <span className="text-sm text-[var(--sqm-text-muted)]">
                {formatDate(jobData.createdAt)}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            {jobData.status === "complete" && jobData.images.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)] hover:border-[var(--sqm-green)]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
            )}
            <Link href="/">
              <Button className="sqm-button">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        }
      />

      {/* Prompt Card */}
      <div className="sqm-card p-6 mb-8">
        <h3 className="text-sm font-medium text-[var(--sqm-text-muted)] mb-2">
          Project Description
        </h3>
        <p className="text-[var(--sqm-text-primary)]">{jobData.prompt}</p>
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
        <div className="mb-8 sqm-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-[var(--sqm-text-primary)]">
                Generation Failed
              </p>
              <p className="text-sm text-[var(--sqm-text-muted)]">
                {jobData.message}
              </p>
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
        <div className="text-center py-12 sqm-card">
          <p className="text-[var(--sqm-text-muted)]">
            No images were generated for this job.
          </p>
        </div>
      )}
    </AppShell>
  );
}
