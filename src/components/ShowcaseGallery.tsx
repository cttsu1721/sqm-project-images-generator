"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
      // Close modal after successful regeneration
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
        // Get filename from Content-Disposition header or use default
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
          <h2 className="text-2xl font-semibold">Architect's Showcase Package</h2>
          {projectInfo && (
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              {projectInfo.prompt}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalImages}</span> images |{" "}
            <span className="font-medium">{passedImages}</span> passed |{" "}
            Avg: <span className="font-medium">{averageScore}%</span>
          </div>
          <div className="flex gap-2">
            {jobId && (
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export PDF
                  </>
                )}
              </Button>
            )}
            {onDownloadAll && (
              <Button onClick={onDownloadAll}>
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
            <div key={category} className="border rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-gray-600"
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
                    <h3 className="font-semibold text-gray-900">{info.name}</h3>
                    <p className="text-sm text-gray-500">{info.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{categoryImages.length} images</Badge>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
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
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryImages.map((image) => (
                    <Card
                      key={image.id}
                      className={`overflow-hidden cursor-pointer transition-shadow hover:shadow-lg ${
                        image.isHero ? "ring-2 ring-blue-500" : ""
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
                            <Badge className="bg-blue-500">Hero</Badge>
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
                        <p className="font-medium text-sm text-gray-900">{image.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {image.attempts} attempt{image.attempts !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Card>
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
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
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
                  <h3 className="text-xl font-semibold">{selectedImage.name}</h3>
                  <p className="text-gray-500 capitalize">
                    {selectedImage.category.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedImage.isHero && <Badge className="bg-blue-500">Hero</Badge>}
                  {selectedImage.lowConfidence && (
                    <Badge variant="destructive">Low Confidence</Badge>
                  )}
                  <Badge variant={getScoreBadgeVariant(selectedImage.consistencyScore)}>
                    {selectedImage.consistencyScore}% match
                  </Badge>
                </div>
              </div>

              {selectedImage.scoreBreakdown && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Consistency Score Breakdown
                  </h4>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(selectedImage.scoreBreakdown).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-semibold">{value}/20</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {key.replace(/_/g, " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = selectedImage.url;
                    a.download = selectedImage.filename;
                    a.click();
                  }}
                >
                  Download Image
                </Button>
                {/* Regenerate button for low-confidence non-hero images */}
                {selectedImage.lowConfidence &&
                  !selectedImage.isHero &&
                  onRegenerateImage && (
                    <Button
                      variant="outline"
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                      onClick={() => handleRegenerate(selectedImage.id)}
                      disabled={regeneratingId === selectedImage.id}
                    >
                      {regeneratingId === selectedImage.id ? (
                        <>
                          <svg
                            className="w-4 h-4 mr-2 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
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
                          Regenerate
                        </>
                      )}
                    </Button>
                  )}
                <Button variant="outline" onClick={() => setSelectedImage(null)}>
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
