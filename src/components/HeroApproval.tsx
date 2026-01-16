"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface StyleAnalysis {
  architectural_style?: {
    primary?: string;
    era_influence?: string;
    design_philosophy?: string;
  };
  materials?: {
    primary_material?: string;
    secondary_material?: string;
    accent_materials?: string[];
    proportions_summary?: string;
  };
  design_elements?: {
    roof_form?: string;
    key_features?: string[];
    window_treatment?: string;
    entry_design?: string;
  };
  colour_scheme?: {
    dominant_colours?: string[];
    accent_colours?: string[];
    temperature?: string;
    contrast_level?: string;
  };
  spatial_qualities?: {
    massing?: string;
    proportions?: string;
    solid_void_ratio?: string;
    scale_feeling?: string;
  };
  distinctive_features?: string[];
  style_summary?: string;
}

export interface HeroApprovalProps {
  jobId: string;
  inspirationImagePath: string;
  heroImagePath: string;
  styleAnalysis?: StyleAnalysis;
  onApprove: () => void;
  onReject: () => void;
  onRegenerate: (feedback: string) => void;
  isLoading?: boolean;
}

export function HeroApproval({
  jobId,
  inspirationImagePath,
  heroImagePath,
  styleAnalysis,
  onApprove,
  onReject,
  onRegenerate,
  isLoading = false,
}: HeroApprovalProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showStyleDetails, setShowStyleDetails] = useState(false);

  const handleRegenerate = () => {
    if (feedback.trim()) {
      onRegenerate(feedback.trim());
      setFeedback("");
      setShowFeedback(false);
    }
  };

  const handleRegenerateClick = () => {
    if (showFeedback && feedback.trim()) {
      handleRegenerate();
    } else {
      setShowFeedback(true);
    }
  };

  return (
    <div className={`space-y-6 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="sqm-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--sqm-text-primary)]">
              Review Generated Hero
            </h2>
            <p className="text-sm text-[var(--sqm-text-secondary)] mt-1">
              Compare the generated hero with your inspiration and approve to continue
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-[var(--sqm-green)]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inspiration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--sqm-text-muted)]" />
              <h3 className="text-sm font-medium text-[var(--sqm-text-secondary)]">
                Your Inspiration
              </h3>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-border-light)]">
              <img
                src={inspirationImagePath}
                alt="Inspiration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Generated Hero */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--sqm-green)]" />
              <h3 className="text-sm font-medium text-[var(--sqm-text-secondary)]">
                Generated Hero
              </h3>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-green)]">
              <img
                src={heroImagePath}
                alt="Generated Hero"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 px-2 py-1 bg-[var(--sqm-green)] text-white text-xs font-medium rounded">
                AI Generated
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style Analysis (Collapsible) */}
      {styleAnalysis && (
        <div className="sqm-card overflow-hidden">
          <button
            onClick={() => setShowStyleDetails(!showStyleDetails)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--sqm-bg-elevated)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`w-5 h-5 text-[var(--sqm-text-muted)] transition-transform ${
                  showStyleDetails ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-[var(--sqm-text-primary)]">
                  Style Analysis
                </h3>
                <p className="text-xs text-[var(--sqm-text-muted)]">
                  {styleAnalysis.architectural_style?.primary || "Contemporary"} •{" "}
                  {styleAnalysis.materials?.primary_material || "Mixed materials"}
                </p>
              </div>
            </div>
            <span className="text-xs text-[var(--sqm-text-muted)]">
              {showStyleDetails ? "Hide" : "Show"} details
            </span>
          </button>

          {showStyleDetails && (
            <div className="p-4 pt-0 border-t border-[var(--sqm-border-light)]">
              {/* Summary */}
              {styleAnalysis.style_summary && (
                <p className="text-sm text-[var(--sqm-text-secondary)] mb-4 italic">
                  "{styleAnalysis.style_summary}"
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Architectural Style */}
                {styleAnalysis.architectural_style && (
                  <div className="p-3 rounded-lg bg-[var(--sqm-bg-elevated)]">
                    <h4 className="text-xs font-medium text-[var(--sqm-green)] uppercase tracking-wide mb-2">
                      Architectural Style
                    </h4>
                    <p className="text-sm text-[var(--sqm-text-primary)]">
                      {styleAnalysis.architectural_style.primary}
                    </p>
                    {styleAnalysis.architectural_style.era_influence && (
                      <p className="text-xs text-[var(--sqm-text-muted)] mt-1">
                        Era: {styleAnalysis.architectural_style.era_influence}
                      </p>
                    )}
                  </div>
                )}

                {/* Materials */}
                {styleAnalysis.materials && (
                  <div className="p-3 rounded-lg bg-[var(--sqm-bg-elevated)]">
                    <h4 className="text-xs font-medium text-[var(--sqm-green)] uppercase tracking-wide mb-2">
                      Materials
                    </h4>
                    <p className="text-sm text-[var(--sqm-text-primary)]">
                      {styleAnalysis.materials.primary_material}
                    </p>
                    {styleAnalysis.materials.secondary_material && (
                      <p className="text-xs text-[var(--sqm-text-muted)] mt-1">
                        + {styleAnalysis.materials.secondary_material}
                      </p>
                    )}
                  </div>
                )}

                {/* Colour Scheme */}
                {styleAnalysis.colour_scheme && (
                  <div className="p-3 rounded-lg bg-[var(--sqm-bg-elevated)]">
                    <h4 className="text-xs font-medium text-[var(--sqm-green)] uppercase tracking-wide mb-2">
                      Colour Palette
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {styleAnalysis.colour_scheme.dominant_colours?.map((colour, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--sqm-bg-secondary)] text-[var(--sqm-text-secondary)]"
                        >
                          {colour}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Design Elements */}
                {styleAnalysis.design_elements?.key_features && (
                  <div className="p-3 rounded-lg bg-[var(--sqm-bg-elevated)]">
                    <h4 className="text-xs font-medium text-[var(--sqm-green)] uppercase tracking-wide mb-2">
                      Key Features
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {styleAnalysis.design_elements.key_features.slice(0, 4).map((feature, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--sqm-bg-secondary)] text-[var(--sqm-text-secondary)]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spatial Qualities */}
                {styleAnalysis.spatial_qualities && (
                  <div className="p-3 rounded-lg bg-[var(--sqm-bg-elevated)]">
                    <h4 className="text-xs font-medium text-[var(--sqm-green)] uppercase tracking-wide mb-2">
                      Spatial Qualities
                    </h4>
                    <p className="text-sm text-[var(--sqm-text-primary)]">
                      {styleAnalysis.spatial_qualities.massing}
                    </p>
                    <p className="text-xs text-[var(--sqm-text-muted)] mt-1">
                      {styleAnalysis.spatial_qualities.scale_feeling}
                    </p>
                  </div>
                )}

                {/* Distinctive Features */}
                {styleAnalysis.distinctive_features && styleAnalysis.distinctive_features.length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--sqm-bg-elevated)]">
                    <h4 className="text-xs font-medium text-[var(--sqm-green)] uppercase tracking-wide mb-2">
                      Distinctive
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {styleAnalysis.distinctive_features.slice(0, 3).map((feature, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--sqm-bg-secondary)] text-[var(--sqm-text-secondary)]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Input (shown when regenerating) */}
      {showFeedback && (
        <div className="sqm-card p-6">
          <h3 className="text-sm font-medium text-[var(--sqm-text-primary)] mb-2">
            What would you like changed?
          </h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Make it more contemporary, use lighter colours, add more glass..."
            className="w-full h-24 px-4 py-3 border border-[var(--sqm-border-light)] rounded-lg focus:ring-2 focus:ring-[var(--sqm-green)] focus:border-[var(--sqm-green)] resize-none bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-primary)] placeholder-[var(--sqm-text-muted)]"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-3 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFeedback(false);
                setFeedback("");
              }}
              disabled={isLoading}
              className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRegenerate}
              disabled={!feedback.trim() || isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Regenerate Hero
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sqm-card p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Reject */}
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 py-4 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Reject & Start Over
          </Button>

          {/* Regenerate */}
          <Button
            type="button"
            variant="outline"
            onClick={handleRegenerateClick}
            disabled={isLoading}
            className="flex-1 py-4 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {showFeedback ? "Add Feedback Below" : "Regenerate with Feedback"}
          </Button>

          {/* Approve */}
          <Button
            type="button"
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 py-4 sqm-button"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Approve & Continue
          </Button>
        </div>

        <p className="text-xs text-[var(--sqm-text-muted)] text-center mt-4">
          Approving will generate 17 additional showcase images based on this hero
        </p>
      </div>
    </div>
  );
}
