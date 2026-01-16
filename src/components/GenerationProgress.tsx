"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface GenerationStatus {
  status:
    | "idle"
    | "parsing"
    | "analyzing"
    | "generating_hero"
    | "generating"
    | "verifying"
    | "complete"
    | "error"
    // Inspiration flow statuses
    | "generating_inspiration_hero"
    | "awaiting_approval"
    | "regenerating_hero"
    | "rejected";
  progress: number;
  currentImage: number;
  totalImages: number;
  currentVariation?: string;
  message?: string;
  flowType?: "text" | "inspiration";
}

interface GenerationProgressProps {
  status: GenerationStatus;
}

export function GenerationProgress({ status }: GenerationProgressProps) {
  if (status.status === "idle" || status.status === "awaiting_approval") {
    // Don't show progress bar during approval - HeroApproval component handles this
    return null;
  }

  const getStatusColor = () => {
    switch (status.status) {
      case "parsing":
        return "bg-indigo-500";
      case "analyzing":
        return "bg-blue-500";
      case "generating_hero":
        return "bg-cyan-500";
      case "generating":
        return "bg-[var(--sqm-green)]";
      case "verifying":
        return "bg-yellow-500";
      case "complete":
        return "bg-[var(--sqm-green)]";
      case "error":
        return "bg-red-500";
      // Inspiration flow statuses
      case "generating_inspiration_hero":
        return "bg-purple-500";
      case "awaiting_approval":
        return "bg-amber-500";
      case "regenerating_hero":
        return "bg-orange-500";
      case "rejected":
        return "bg-red-400";
      default:
        return "bg-[var(--sqm-text-muted)]";
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "parsing":
        return "Analyzing project description...";
      case "analyzing":
        return "Analyzing hero image...";
      case "generating_hero":
        return "Generating hero image...";
      case "generating":
        return `Generating ${status.currentVariation?.replace(/_/g, " ") || "image"}...`;
      case "verifying":
        return "Verifying consistency...";
      case "complete":
        return "Generation complete!";
      case "error":
        return "Error occurred";
      // Inspiration flow statuses
      case "generating_inspiration_hero":
        return "Analyzing inspiration & generating hero...";
      case "awaiting_approval":
        return "Hero ready for your approval";
      case "regenerating_hero":
        return "Regenerating hero with your feedback...";
      case "rejected":
        return "Hero rejected";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="sqm-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="font-medium text-[var(--sqm-text-primary)]">{getStatusText()}</span>
        </div>
        <Badge variant="outline" className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)]">
          {status.currentImage} / {status.totalImages}
        </Badge>
      </div>

      <Progress value={status.progress} className="h-2" />

      {status.message && (
        <p className="text-sm text-[var(--sqm-text-muted)]">{status.message}</p>
      )}

      {status.status === "verifying" && (
        <div className="text-xs text-[var(--sqm-text-muted)]">
          Checking architectural consistency (threshold: &gt; 80%)
        </div>
      )}
    </div>
  );
}
