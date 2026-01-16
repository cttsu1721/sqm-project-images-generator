# Project: SQM Project Images Generator

## Overview

A web application for SQM Architects that generates multiple architectural images from a single hero project image. Uses Claude Agent SDK to orchestrate the workflow and Google Gemini 3 Pro for image generation with AI-powered consistency verification.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Orchestration**: Claude Agent SDK (Python)
- **Image Generation**: Google Gemini 3 Pro (`gemini-3-pro-image-preview`)
- **Storage**: Local filesystem (./generated-images)
- **Auth**: None (internal tool)

## Key Features

1. **Image Upload**: Drag-and-drop hero project image
2. **AI Generation**: 6-10 variations from different angles, lighting, environments
3. **AI Verification**: Each generated image scored for consistency (> 80% required)
4. **Auto-Revision**: Failed images regenerated with fixing prompts (max 3 attempts)
5. **Results Gallery**: Display with scores and download options

## Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Main upload + gallery page
│   ├── layout.tsx            # App layout
│   └── api/
│       ├── generate/         # Start generation job
│       └── status/[jobId]/   # Poll job status
├── components/
│   ├── ui/                   # shadcn components
│   ├── ImageUploader.tsx     # Drag-drop upload
│   ├── GenerationProgress.tsx
│   └── ImageGallery.tsx
└── lib/
    └── utils.ts

agent/
├── main.py                   # Claude Agent entry point
├── tools/
│   ├── gemini_image.py      # Gemini API tool
│   ├── verify_consistency.py # AI verification
│   └── storage.py           # Image storage
└── prompts/
    └── variations.py        # Variation templates
```

## Commands

```bash
# Frontend
npm run dev          # Start Next.js dev server
npm run build        # Production build

# Python Agent
cd agent && python main.py [image_path] [output_dir]
```

## Environment Variables

See `.env.example` for all required variables:
- `GOOGLE_AI_API_KEY` - Google AI Studio API key
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude Agent SDK

## Verification Threshold

Images must score > 80% consistency to pass. Scoring criteria:
- Building Shape (0-20)
- Architectural Style (0-20)
- Materials/Facade (0-20)
- Windows/Openings (0-20)
- Proportions (0-20)
