"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface GenerationStatus {
  status: "idle" | "parsing" | "analyzing" | "generating_hero" | "generating" | "verifying" | "complete" | "error";
  progress: number;
  currentImage: number;
  totalImages: number;
  currentVariation?: string;
  message?: string;
}

interface GenerationProgressProps {
  status: GenerationStatus;
}

export function GenerationProgress({ status }: GenerationProgressProps) {
  if (status.status === "idle") {
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
        return "bg-purple-500";
      case "verifying":
        return "bg-yellow-500";
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
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
      default:
        return "Processing...";
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="font-medium">{getStatusText()}</span>
        </div>
        <Badge variant="outline">
          {status.currentImage} / {status.totalImages}
        </Badge>
      </div>

      <Progress value={status.progress} className="h-2" />

      {status.message && (
        <p className="text-sm text-gray-500">{status.message}</p>
      )}

      {status.status === "verifying" && (
        <div className="text-xs text-gray-400">
          Checking architectural consistency (threshold: &gt; 80%)
        </div>
      )}
    </Card>
  );
}
