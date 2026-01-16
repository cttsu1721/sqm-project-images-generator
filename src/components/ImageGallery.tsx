"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface GeneratedImage {
  id: string;
  url: string;
  variationType: string;
  consistencyScore: number;
  attempts: number;
  lowConfidence: boolean;
  scoreBreakdown?: {
    building_shape: number;
    architectural_style: number;
    materials_facade: number;
    windows_openings: number;
    proportions: number;
  };
}

interface ImageGalleryProps {
  images: GeneratedImage[];
  onDownloadAll?: () => void;
  onRegenerate?: (imageId: string) => void;
}

export function ImageGallery({
  images,
  onDownloadAll,
  onRegenerate,
}: ImageGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score > 85) return "bg-green-500";
    if (score > 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score > 85) return "default";
    if (score > 80) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-serif text-[var(--sqm-text-primary)]">Generated Variations</h2>
        {onDownloadAll && (
          <Button onClick={onDownloadAll} className="sqm-button">Download All</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="sqm-card overflow-hidden">
            <div className="relative">
              <img
                src={image.url}
                alt={image.variationType}
                className="w-full h-48 object-cover"
              />
              {image.lowConfidence && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive">Low Confidence</Badge>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={getScoreBadgeVariant(image.consistencyScore)}>
                  {image.consistencyScore}%
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize text-[var(--sqm-text-primary)]">
                  {image.variationType.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-[var(--sqm-text-muted)]">
                  {image.attempts} attempt{image.attempts !== 1 ? "s" : ""}
                </span>
              </div>

              {image.scoreBreakdown && (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--sqm-text-secondary)] font-medium">Score Breakdown:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-[var(--sqm-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Shape</span>
                      <span>{image.scoreBreakdown.building_shape}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Style</span>
                      <span>{image.scoreBreakdown.architectural_style}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materials</span>
                      <span>{image.scoreBreakdown.materials_facade}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Windows</span>
                      <span>{image.scoreBreakdown.windows_openings}/20</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span>Proportions</span>
                      <span>{image.scoreBreakdown.proportions}/20</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)] hover:border-[var(--sqm-green)]"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = image.url;
                    a.download = `${image.variationType}.png`;
                    a.click();
                  }}
                >
                  Download
                </Button>
                {onRegenerate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)] hover:border-[var(--sqm-green)]"
                    onClick={() => onRegenerate(image.id)}
                  >
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
