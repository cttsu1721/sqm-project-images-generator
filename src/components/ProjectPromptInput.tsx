"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MELBOURNE_SUBURBS, PROJECT_TYPES, SUBURBS_BY_REGION } from "@/lib/data/suburbs";

export interface GenerationParams {
  prompt: string;
  projectType?: string;
  suburb?: string;
}

interface ProjectPromptInputProps {
  onGenerate: (params: GenerationParams) => void;
  disabled?: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Dual Occupancy - Balwyn North",
    prompt: "Dual occupancy in Balwyn North, luxury finish, dark brick with timber battens, double garages",
    projectType: "dual_occupancy",
    suburb: "balwyn_north",
  },
  {
    title: "Townhouses - Box Hill",
    prompt: "4-unit townhouse development in Box Hill, contemporary with Asian-influenced design, near station",
    projectType: "townhouses",
    suburb: "box_hill",
  },
  {
    title: "Boutique Apartments - Hawthorn",
    prompt: "3-storey boutique apartments in Hawthorn, 8 units, heritage street context, red brick",
    projectType: "apartments",
    suburb: "hawthorn",
  },
  {
    title: "Modern Duplex - Glen Waverley",
    prompt: "Modern duplex in Glen Waverley, white render with timber accents, north-facing living",
    projectType: "dual_occupancy",
    suburb: "glen_waverley",
  },
  {
    title: "Executive Townhouses - Templestowe",
    prompt: "Executive townhouses in Templestowe, bush backdrop, cantilevered forms, native landscaping",
    projectType: "townhouses",
    suburb: "templestowe",
  },
  {
    title: "Mixed-Use - Richmond",
    prompt: "Mixed-use development in Richmond, ground floor cafe, apartments above, warehouse aesthetic",
    projectType: "apartments",
    suburb: "richmond",
  },
];

export function ProjectPromptInput({ onGenerate, disabled }: ProjectPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState<string>("");
  const [suburb, setSuburb] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate({
        prompt: prompt.trim(),
        projectType: projectType || undefined,
        suburb: suburb || undefined,
      });
    }
  };

  const handleExampleClick = (example: typeof EXAMPLE_PROMPTS[0]) => {
    setPrompt(example.prompt);
    setProjectType(example.projectType);
    setSuburb(example.suburb);
  };

  const selectedProjectType = PROJECT_TYPES.find(p => p.value === projectType);
  const selectedSuburb = MELBOURNE_SUBURBS.find(s => s.value === suburb);

  return (
    <div className="space-y-6">
      <Card className={`p-6 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick-select dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
                Project Type <span className="text-gray-400">(optional)</span>
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Auto-detect from prompt</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {selectedProjectType && (
                <p className="mt-1 text-xs text-gray-500">{selectedProjectType.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-2">
                Melbourne Suburb <span className="text-gray-400">(optional)</span>
              </label>
              <select
                id="suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Auto-detect from prompt</option>
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
                <p className="mt-1 text-xs text-gray-500">{selectedSuburb.region} Melbourne</p>
              )}
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your development project
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Modern dual occupancy in Balwyn North, dark brick facade with timber battens, double garages, landscaped front gardens..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
              disabled={disabled}
            />
            <p className="mt-2 text-sm text-gray-500">
              Describe materials, style, and any special features. Project type and suburb from dropdowns will be used if selected.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!prompt.trim() || disabled}
            className="w-full py-6 text-lg"
          >
            Generate Showcase Package (18 images)
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Example prompts - click to use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={disabled}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="font-medium text-gray-900 text-sm">{example.title}</p>
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{example.prompt}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
