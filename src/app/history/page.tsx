"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";

interface Job {
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

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--sqm-green)]/10 text-[var(--sqm-green)]">
            Complete
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
            In Progress
          </span>
        );
    }
  };

  const formatProjectType = (type: string | null) => {
    if (!type) return null;
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSuburb = (suburb: string | null) => {
    if (!suburb) return null;
    return suburb.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <AppShell>
      <PageHeader
        title="History"
        subtitle="View and manage your previous project generations"
        actions={
          <Link href="/">
            <Button className="sqm-button">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        }
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[var(--sqm-green)] animate-spin" />
          <span className="ml-3 text-[var(--sqm-text-muted)]">
            Loading history...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-20 sqm-card">
          <div className="w-16 h-16 bg-[var(--sqm-bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-[var(--sqm-text-muted)]" />
          </div>
          <h3 className="text-lg font-serif font-medium text-[var(--sqm-text-primary)] mb-2">
            No projects yet
          </h3>
          <p className="text-[var(--sqm-text-muted)] mb-6">
            Create your first architectural showcase package
          </p>
          <Link href="/">
            <Button className="sqm-button">Create First Project</Button>
          </Link>
        </div>
      )}

      {/* Jobs Grid */}
      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <Link key={job.jobId} href={`/history/${job.jobId}`}>
              <div className="sqm-card overflow-hidden group cursor-pointer h-full">
                {/* Thumbnail */}
                <div className="aspect-video bg-[var(--sqm-bg-elevated)] relative overflow-hidden">
                  {job.thumbnail ? (
                    <img
                      src={job.thumbnail}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-[var(--sqm-text-muted)] opacity-40" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(job.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {job.projectType && (
                      <Badge
                        variant="outline"
                        className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] text-xs"
                      >
                        {formatProjectType(job.projectType)}
                      </Badge>
                    )}
                    {job.suburb && (
                      <Badge className="bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-secondary)] text-xs border border-[var(--sqm-border)]">
                        {formatSuburb(job.suburb)}
                      </Badge>
                    )}
                  </div>

                  {/* Prompt */}
                  <p className="text-sm text-[var(--sqm-text-secondary)] line-clamp-2 mb-3">
                    {job.prompt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-[var(--sqm-text-muted)]">
                    <span>
                      {job.imageCount > 0
                        ? `${job.imageCount} images`
                        : "No images"}
                    </span>
                    <span>{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
