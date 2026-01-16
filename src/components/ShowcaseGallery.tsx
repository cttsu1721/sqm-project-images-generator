"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ShowcaseImage {
  id: string;
  filename: string;
  url: string;
  variationType: string;
  category: string;
  name: string;
  isHero: boolean;
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

interface ShowcaseGalleryProps {
  images: ShowcaseImage[];
  projectInfo?: {
    prompt: string;
    suburb?: string;
    projectType?: string;
  };
  onDownloadAll?: () => void;
  onRegenerateImage?: (imageId: string) => Promise<void>;
  jobId?: string;
}

const CATEGORY_INFO: Record<string, { name: string; description: string; icon: string }> = {
  hero_shots: {
    name: "Hero Shots",
    description: "The money shots - website banners, brochure covers",
    icon: "M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm8 6a3 3 0 11-6 0 3 3 0 016 0zm-3 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z",
  },
  site_context: {
    name: "Site & Context",
    description: "How it fits the neighbourhood - planning permits",
    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  },
  architectural_features: {
    name: "Architectural Features",
    description: "Design thinking and quality detailing",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  interior_spaces: {
    name: "Key Interior Spaces",
    description: "Livability and spatial quality for buyers",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  spatial_experience: {
    name: "Spatial Experience",
    description: "The wow factor - volume and light",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  lifestyle_atmosphere: {
    name: "Lifestyle & Atmosphere",
    description: "Emotional connection for buyers",
    icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  },
};

const CATEGORY_ORDER = [
  "hero_shots",
  "site_context",
  "architectural_features",
  "interior_spaces",
  "spatial_experience",
  "lifestyle_atmosphere",
];

export function ShowcaseGallery({
  images,
  projectInfo,
  onDownloadAll,
  onRegenerateImage,
  jobId,
}: ShowcaseGalleryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER)
  );
  const [selectedImage, setSelectedImage] = useState<ShowcaseImage | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  if (images.length === 0) {
    return null;
  }

  // Group images by category
  const imagesByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = images.filter((img) => img.category === category);
    return acc;
  }, {} as Record<string, ShowcaseImage[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score > 85) return "default";
    if (score > 80) return "secondary";
    return "destructive";
  };

  const handleRegenerate = async (imageId: string) => {
    if (!onRegenerateImage || regeneratingId) return;

    setRegeneratingId(imageId);
    try {
      await onRegenerateImage(imageId);
      setSelectedImage(null);
    } catch (error) {
      console.error("Regeneration failed:", error);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleExportPdf = async () => {
    if (!jobId || exportingPdf) return;

    setExportingPdf(true);
    try {
      const response = await fetch(`/api/export-pdf/${jobId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        a.download = filenameMatch ? filenameMatch[1] : `showcase-${jobId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("PDF export failed");
      }
    } catch (error) {
      console.error("PDF export error:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  const totalImages = images.length;
  const passedImages = images.filter((img) => img.consistencyScore > 80).length;
  const averageScore = Math.round(
    images.reduce((sum, img) => sum + img.consistencyScore, 0) / images.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-[var(--sqm-text-primary)]">Architect's Showcase Package</h2>
          {projectInfo && (
            <p className="text-sm text-[var(--sqm-text-muted)] mt-1 max-w-2xl">
              {projectInfo.prompt}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-[var(--sqm-text-secondary)]">
            <span className="font-medium text-[var(--sqm-text-primary)]">{totalImages}</span> images |{" "}
            <span className="font-medium text-[var(--sqm-green)]">{passedImages}</span> passed |{" "}
            Avg: <span className="font-medium text-[var(--sqm-text-primary)]">{averageScore}%</span>
          </div>
          <div className="flex gap-2">
            {jobId && (
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)] hover:border-[var(--sqm-green)]"
              >
                {exportingPdf ? "Exporting..." : "Export PDF"}
              </Button>
            )}
            {onDownloadAll && (
              <Button onClick={onDownloadAll} className="sqm-button">
                Download All as ZIP
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((category) => {
          const categoryImages = imagesByCategory[category];
          const info = CATEGORY_INFO[category];
          const isExpanded = expandedCategories.has(category);

          if (!categoryImages || categoryImages.length === 0) return null;

          return (
            <div key={category} className="sqm-card overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-[var(--sqm-bg-elevated)] hover:bg-[var(--sqm-bg-secondary)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-[var(--sqm-green)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={info.icon}
                    />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold text-[var(--sqm-text-primary)]">{info.name}</h3>
                    <p className="text-sm text-[var(--sqm-text-muted)]">{info.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)]">
                    {categoryImages.length} images
                  </Badge>
                  <svg
                    className={`w-5 h-5 text-[var(--sqm-text-muted)] transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Category Images */}
              {isExpanded && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-[var(--sqm-bg-secondary)]">
                  {categoryImages.map((image) => (
                    <div
                      key={image.id}
                      className={`sqm-card overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                        image.isHero ? "ring-2 ring-[var(--sqm-green)]" : ""
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="relative aspect-video">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        {image.isHero && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-[var(--sqm-green)]">Hero</Badge>
                          </div>
                        )}
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
                      <div className="p-3">
                        <p className="font-medium text-sm text-[var(--sqm-text-primary)]">{image.name}</p>
                        <p className="text-xs text-[var(--sqm-text-muted)] mt-1">
                          {image.attempts} attempt{image.attempts !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-[var(--sqm-bg-secondary)] border border-[var(--sqm-border)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-full h-auto"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--sqm-text-primary)]">{selectedImage.name}</h3>
                  <p className="text-[var(--sqm-text-muted)] capitalize">
                    {selectedImage.category.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedImage.isHero && <Badge className="bg-[var(--sqm-green)]">Hero</Badge>}
                  {selectedImage.lowConfidence && (
                    <Badge variant="destructive">Low Confidence</Badge>
                  )}
                  <Badge variant={getScoreBadgeVariant(selectedImage.consistencyScore)}>
                    {selectedImage.consistencyScore}% match
                  </Badge>
                </div>
              </div>

              {selectedImage.scoreBreakdown && (
                <div className="bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-border)] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[var(--sqm-text-secondary)] mb-3">
                    Consistency Score Breakdown
                  </h4>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(selectedImage.scoreBreakdown).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-semibold text-[var(--sqm-text-primary)]">{value}/20</div>
                        <div className="text-xs text-[var(--sqm-text-muted)] capitalize">
                          {key.replace(/_/g, " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 sqm-button"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = selectedImage.url;
                    a.download = selectedImage.filename;
                    a.click();
                  }}
                >
                  Download Image
                </Button>
                {selectedImage.lowConfidence &&
                  !selectedImage.isHero &&
                  onRegenerateImage && (
                    <Button
                      variant="outline"
                      className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => handleRegenerate(selectedImage.id)}
                      disabled={regeneratingId === selectedImage.id}
                    >
                      {regeneratingId === selectedImage.id ? "Regenerating..." : "Regenerate"}
                    </Button>
                  )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                  className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)]"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
