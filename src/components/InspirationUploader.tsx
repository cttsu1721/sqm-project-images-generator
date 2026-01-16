"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MELBOURNE_SUBURBS, PROJECT_TYPES, SUBURBS_BY_REGION } from "@/lib/data/suburbs";

export interface InspirationParams {
  inspirationImage: File;
  prompt?: string;
  projectType?: string;
  suburb?: string;
}

interface InspirationUploaderProps {
  onGenerate: (params: InspirationParams) => void;
  disabled?: boolean;
}

export function InspirationUploader({ onGenerate, disabled }: InspirationUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState<string>("");
  const [suburb, setSuburb] = useState<string>("");

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onGenerate({
        inspirationImage: selectedFile,
        prompt: prompt.trim() || undefined,
        projectType: projectType || undefined,
        suburb: suburb || undefined,
      });
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const selectedProjectType = PROJECT_TYPES.find(p => p.value === projectType);
  const selectedSuburb = MELBOURNE_SUBURBS.find(s => s.value === suburb);

  return (
    <div className={`space-y-6 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Upload Area */}
      <div className="sqm-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inspiration Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--sqm-text-primary)] mb-2">
              Inspiration Image <span className="text-[var(--sqm-green)]">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors bg-[var(--sqm-bg-elevated)] ${
                isDragActive
                  ? "border-[var(--sqm-green)] bg-[var(--sqm-bg-secondary)]"
                  : "border-[var(--sqm-border-light)] hover:border-[var(--sqm-green)]"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="p-4">
                  <img
                    src={preview}
                    alt="Inspiration preview"
                    className="w-full h-auto max-h-64 object-contain rounded-lg"
                  />
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      disabled={disabled}
                      className="border-[var(--sqm-border-light)] text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)] hover:border-[var(--sqm-green)]"
                    >
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 cursor-pointer">
                  <svg
                    className="w-12 h-12 text-[var(--sqm-text-muted)] mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-base font-medium text-[var(--sqm-text-primary)]">
                    Drop your inspiration image here
                  </p>
                  <p className="text-sm text-[var(--sqm-text-secondary)] mt-1">
                    or click to browse
                  </p>
                  <p className="text-xs text-[var(--sqm-text-muted)] mt-3">
                    Use an architectural photo you like as style reference
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Optional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-[var(--sqm-text-primary)] mb-2">
                Project Type <span className="text-[var(--sqm-text-muted)]">(optional)</span>
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-[var(--sqm-border-light)] rounded-lg focus:ring-2 focus:ring-[var(--sqm-green)] focus:border-[var(--sqm-green)] bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-primary)]"
              >
                <option value="">Auto-detect</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {selectedProjectType && (
                <p className="mt-1 text-xs text-[var(--sqm-text-muted)]">{selectedProjectType.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="suburb" className="block text-sm font-medium text-[var(--sqm-text-primary)] mb-2">
                Melbourne Suburb <span className="text-[var(--sqm-text-muted)]">(optional)</span>
              </label>
              <select
                id="suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-[var(--sqm-border-light)] rounded-lg focus:ring-2 focus:ring-[var(--sqm-green)] focus:border-[var(--sqm-green)] bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-primary)]"
              >
                <option value="">Auto-detect</option>
                {Object.entries(SUBURBS_BY_REGION).map(([region, suburbs]) => (
                  <optgroup key={region} label={`${region} Suburbs`}>
                    {suburbs.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedSuburb && (
                <p className="mt-1 text-xs text-[var(--sqm-text-muted)]">{selectedSuburb.region} Melbourne</p>
              )}
            </div>
          </div>

          {/* Optional Prompt */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-[var(--sqm-text-primary)] mb-2">
              Additional Guidance <span className="text-[var(--sqm-text-muted)]">(optional)</span>
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Make it 3 storeys with a larger garage, use more timber..."
              className="w-full h-24 px-4 py-3 border border-[var(--sqm-border-light)] rounded-lg focus:ring-2 focus:ring-[var(--sqm-green)] focus:border-[var(--sqm-green)] resize-none bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-primary)] placeholder-[var(--sqm-text-muted)]"
              disabled={disabled}
            />
            <p className="mt-1 text-xs text-[var(--sqm-text-muted)]">
              Describe any specific changes or additions you want compared to the inspiration
            </p>
          </div>

          <Button
            type="submit"
            disabled={!selectedFile || disabled}
            className="w-full py-6 text-lg sqm-button"
          >
            Generate Inspired Hero
          </Button>
        </form>
      </div>

      {/* How It Works */}
      <div className="sqm-card p-6">
        <h3 className="text-sm font-medium text-[var(--sqm-text-primary)] mb-3">How Inspiration Mode Works</h3>
        <div className="space-y-3 text-sm text-[var(--sqm-text-secondary)]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-green)] flex items-center justify-center text-xs text-[var(--sqm-green)]">1</div>
            <p>Upload an architectural photo you like as a style reference</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-green)] flex items-center justify-center text-xs text-[var(--sqm-green)]">2</div>
            <p>AI analyzes the style, materials, and design language</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-green)] flex items-center justify-center text-xs text-[var(--sqm-green)]">3</div>
            <p>A NEW hero image is generated capturing that aesthetic (not a copy)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sqm-bg-elevated)] border border-[var(--sqm-green)] flex items-center justify-center text-xs text-[var(--sqm-green)]">4</div>
            <p>Review and approve the hero, then 17 more showcase images are generated</p>
          </div>
        </div>
      </div>
    </div>
  );
}
