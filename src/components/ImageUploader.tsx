"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelect, disabled }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File) => {
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
    },
    []
  );

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

  const handleGenerate = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      <Card
        className={`relative border-2 border-dashed transition-colors bg-[var(--sqm-bg-elevated)] ${
          isDragActive
            ? "border-[var(--sqm-green)] bg-[var(--sqm-bg-secondary)]"
            : "border-[var(--sqm-border-light)] hover:border-[var(--sqm-green)]"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="p-4">
            <img
              src={preview}
              alt="Hero project preview"
              className="w-full h-auto max-h-96 object-contain rounded-lg"
            />
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="outline" onClick={handleClear} disabled={disabled}>
                Clear
              </Button>
              <Button onClick={handleGenerate} disabled={disabled}>
                Generate Variations
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-12 cursor-pointer">
            <svg
              className="w-16 h-16 text-[var(--sqm-text-muted)] mb-4"
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
            <p className="text-lg font-medium text-[var(--sqm-text-primary)]">
              Drop your hero project image here
            </p>
            <p className="text-sm text-[var(--sqm-text-secondary)] mt-1">
              or click to browse
            </p>
            <p className="text-xs text-[var(--sqm-text-muted)] mt-4">
              Supports JPG, PNG, WebP
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        )}
      </Card>
    </div>
  );
}
