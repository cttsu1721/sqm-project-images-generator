#!/usr/bin/env python3
"""
SQM Project Images Generator - Claude Agent

This agent orchestrates the generation of architectural image variations
using Google Gemini 3 Pro, with AI-powered consistency verification.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from claude_agent_sdk import query, ClaudeAgentOptions

# Load environment variables
load_dotenv()

# Import custom tools
from tools.gemini_image import gemini_generate_image
from tools.verify_consistency import verify_consistency
from tools.storage import store_image, update_job_status

# Configuration
VERIFICATION_THRESHOLD = int(os.getenv("VERIFICATION_THRESHOLD", "80"))
MAX_REGEN_ATTEMPTS = int(os.getenv("MAX_REGEN_ATTEMPTS", "3"))
MAX_IMAGES = int(os.getenv("MAX_IMAGES_PER_JOB", "10"))


async def generate_variations(hero_image_path: str, output_dir: str, job_id: str):
    """
    Main agent function that generates image variations from a hero image.

    Args:
        hero_image_path: Path to the uploaded hero image
        output_dir: Directory to save generated images
        job_id: Unique job identifier for status tracking
    """

    # Ensure output directory exists
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Update initial status
    await update_job_status(job_id, {
        "status": "analyzing",
        "progress": 5,
        "currentImage": 0,
        "totalImages": 8,
        "message": "Analyzing hero image architectural features..."
    })

    prompt = f"""
    You are an architectural image generation specialist for SQM Architects.

    Analyze the architectural image at {hero_image_path} and generate
    6-10 variations using the gemini_generate_image tool.

    WORKFLOW FOR EACH VARIATION:

    1. ANALYZE: First describe what architectural features must be preserved:
       - Building shape/silhouette
       - Architectural style (modern, traditional, etc.)
       - Materials and facade (glass, concrete, brick, etc.)
       - Window patterns and placements
       - Number of floors and proportions

    2. GENERATE VARIATIONS: Create images for these variation types:
       ANGLE VARIATIONS (3-4 images):
       - aerial_view: Bird's eye view from above
       - street_level: Ground perspective looking up
       - corner_view: 45-degree diagonal angle
       - detail_closeup: Architectural detail focus

       TIME/LIGHTING VARIATIONS (2-3 images):
       - golden_hour: Sunset warm lighting
       - night_scene: Night with interior lights on
       - overcast: Moody cloudy atmosphere

       ENVIRONMENTAL (1-2 images):
       - with_landscaping: Building with surrounding gardens
       - with_people: Human figures for scale

    3. FOR EACH VARIATION:
       a) Generate the image using gemini_generate_image tool
          - Provide the hero image path: {hero_image_path}
          - Specify variation type and detailed prompt
          - Use appropriate aspect ratio (16:9 for landscapes, 4:3 for others)

       b) Verify using verify_consistency tool
          - Compare against hero image
          - Get score breakdown for all 5 criteria

       c) REVISION LOOP (if score <= {VERIFICATION_THRESHOLD}%):
          - Parse the verification issues and suggestions
          - Build a FIXING PROMPT that includes:
            * Original variation request
            * FIX instructions for each failed criterion
            * MAINTAIN instructions for hero features
          - Regenerate with the fixing prompt
          - Re-verify the new image
          - Repeat until score > {VERIFICATION_THRESHOLD}% OR max {MAX_REGEN_ATTEMPTS} attempts

       d) Store the image using store_image tool
          - Pass job_id: {job_id}
          - Include final consistency score
          - Flag as low-confidence if max attempts reached without passing

    4. After each image, update progress status

    QUALITY REQUIREMENTS:
    - Minimum acceptance threshold: > {VERIFICATION_THRESHOLD}% consistency score
    - Each criterion worth 20 points (total 100):
      * Building Shape (0-20)
      * Architectural Style (0-20)
      * Materials/Facade (0-20)
      * Windows/Openings (0-20)
      * Proportions (0-20)
    - Building silhouette, style, materials MUST closely match the hero

    OUTPUT: For each variation, report:
    - Variation type
    - Final consistency score
    - Number of revision attempts
    - Any low-confidence flags

    IMPORTANT:
    - Job ID for status updates: {job_id}
    - Output directory: {output_dir}
    - Generate at least 6 variations, up to 10 maximum
    - Always verify before storing
    """

    try:
        async for message in query(
            prompt=prompt,
            options=ClaudeAgentOptions(
                tools=[gemini_generate_image, verify_consistency, store_image, update_job_status],
                permission_mode="bypassPermissions"
            )
        ):
            # Log agent messages for debugging
            if hasattr(message, 'result'):
                print(f"Agent result: {message.result[:200]}..." if len(str(message.result)) > 200 else f"Agent result: {message.result}")
            elif hasattr(message, 'type'):
                print(f"Message type: {message.type}")

    except Exception as e:
        print(f"Agent error: {e}")
        await update_job_status(job_id, {
            "status": "error",
            "progress": 0,
            "message": f"Generation failed: {str(e)}"
        })
        raise


async def main():
    """CLI entry point for the agent."""
    if len(sys.argv) < 4:
        print("Usage: python main.py <hero_image_path> <output_dir> <job_id>")
        sys.exit(1)

    hero_image_path = sys.argv[1]
    output_dir = sys.argv[2]
    job_id = sys.argv[3]

    if not os.path.exists(hero_image_path):
        print(f"Error: Hero image not found at {hero_image_path}")
        sys.exit(1)

    print(f"Starting generation for job {job_id}")
    print(f"Hero image: {hero_image_path}")
    print(f"Output directory: {output_dir}")

    await generate_variations(hero_image_path, output_dir, job_id)

    print("Generation complete!")


if __name__ == "__main__":
    asyncio.run(main())
