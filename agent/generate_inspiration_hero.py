#!/usr/bin/env python3
"""
Generate Hero Image from Inspiration

This script generates a hero image based on an inspiration image's style.
The generated hero is saved for user approval before continuing with the
full 18-image showcase generation.

Usage:
    python generate_inspiration_hero.py <inspiration_path> <output_dir> <job_id> [options]

Options:
    --prompt TEXT           Optional user prompt for additional guidance
    --project-type TYPE     Project type (dual_occupancy, townhouses, apartments)
    --suburb NAME           Melbourne suburb name
    --feedback TEXT         User feedback for regeneration (optional)
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from prompts import (
    build_suburb_context_prompt,
    build_photorealistic_prompt,
    build_style_analysis_prompt,
    build_style_transfer_hero_prompt,
    build_regeneration_prompt_with_feedback,
)

# Configure Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# Models
IMAGE_MODEL = "gemini-3-pro-image-preview"
VISION_MODEL = "gemini-2.0-flash"
TEXT_MODEL = "gemini-2.0-flash"


def update_status(job_id: str, output_dir: str, status_data: Dict[str, Any]):
    """Update the job status file."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    status_path = Path(output_dir) / "status.json"

    existing = {}
    if status_path.exists():
        with open(status_path, "r") as f:
            existing = json.load(f)

    existing.update(status_data)
    existing["updated_at"] = datetime.now().isoformat()

    with open(status_path, "w") as f:
        json.dump(existing, f, indent=2)


def load_image_as_part(image_path: str) -> types.Part:
    """Load an image file and convert to Gemini Part."""
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    ext = Path(image_path).suffix.lower()
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    mime_type = mime_types.get(ext, "image/png")

    return types.Part.from_bytes(data=image_bytes, mime_type=mime_type)


def parse_user_prompt(prompt: str) -> Dict[str, Any]:
    """Parse the user's text prompt to extract project details."""
    if not prompt:
        return {
            "project_type": "dual_occupancy",
            "suburb": None,
            "num_units": 2,
            "storeys": 2,
            "style_keywords": [],
            "materials": [],
            "special_features": [],
            "finish_level": "premium",
            "summary": ""
        }

    parse_prompt = """<task>
Analyze the architectural project description and extract structured details.
</task>

<input>
{prompt}
</input>

<output_format>
Return a single JSON object with these fields:
{{
    "project_type": "dual_occupancy" | "townhouses" | "apartments",
    "suburb": "<suburb name or null if not mentioned>",
    "num_units": <number or null>,
    "storeys": <number or null>,
    "style_keywords": ["modern", "heritage", "contemporary", etc],
    "materials": ["brick", "render", "timber", "glass", etc],
    "special_features": ["cantilever", "courtyard", "rooftop", etc],
    "finish_level": "standard" | "premium" | "luxury",
    "summary": "<one sentence summary>"
}}
</output_format>

<rules>
- If suburb not mentioned, set to null
- Default project_type to "dual_occupancy" if unclear
- Extract ALL mentioned materials and style keywords
- finish_level: "luxury" if premium/high-end/luxury mentioned, "standard" if basic/affordable, else "premium"
- Return ONLY the JSON object, no markdown formatting
</rules>""".format(prompt=prompt)

    try:
        response = client.models.generate_content(
            model=TEXT_MODEL,
            contents=parse_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=1.0,
            )
        )

        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        parsed = json.loads(result_text.strip())
        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]
        return parsed
    except Exception as e:
        print(f"Prompt parsing error: {e}")
        return {
            "project_type": "dual_occupancy",
            "suburb": None,
            "num_units": 2,
            "storeys": 2,
            "style_keywords": [],
            "materials": [],
            "special_features": [],
            "finish_level": "premium",
            "summary": prompt
        }


def analyze_inspiration_style(inspiration_path: str) -> Dict[str, Any]:
    """
    Analyze the inspiration image to extract style elements.

    Returns a dictionary with architectural style, materials, design elements,
    colours, spatial qualities, and distinctive features.
    """
    print("  Analyzing inspiration image style...")

    try:
        analysis_prompt = build_style_analysis_prompt()
        image_part = load_image_as_part(inspiration_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[image_part, analysis_prompt],  # Image FIRST
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.5,  # Slightly lower for consistent analysis
            )
        )

        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        style_analysis = json.loads(result_text.strip())
        print(f"  Style identified: {style_analysis.get('architectural_style', {}).get('primary', 'Unknown')}")
        return style_analysis

    except Exception as e:
        print(f"  Style analysis error: {e}")
        # Return default style analysis
        return {
            "architectural_style": {
                "primary": "Contemporary",
                "era_influence": "2020s",
                "design_philosophy": "Clean lines and quality materials"
            },
            "materials": {
                "primary_material": "Quality facade materials",
                "secondary_material": "Complementary accents",
                "accent_materials": [],
                "proportions_summary": "Balanced mix of materials"
            },
            "design_elements": {
                "roof_form": "Contemporary",
                "key_features": ["Quality detailing"],
                "window_treatment": "Well-proportioned openings",
                "entry_design": "Welcoming threshold"
            },
            "colour_scheme": {
                "dominant_colours": ["Neutral tones"],
                "accent_colours": [],
                "temperature": "Neutral",
                "contrast_level": "Medium"
            },
            "spatial_qualities": {
                "massing": "Articulated",
                "proportions": "Balanced",
                "solid_void_ratio": "Balanced",
                "scale_feeling": "Human-scale"
            },
            "distinctive_features": ["Professional architectural quality"],
            "style_summary": "A contemporary design with quality materials and clean architectural lines."
        }


def generate_hero_image(
    prompt: str,
    inspiration_path: str,
    aspect_ratio: str = "16:9"
) -> Optional[bytes]:
    """
    Generate a hero image using Gemini with inspiration image as reference.

    Args:
        prompt: The style transfer prompt
        inspiration_path: Path to inspiration image
        aspect_ratio: Output aspect ratio

    Returns:
        Image bytes or None if generation fails
    """
    try:
        # Build contents: inspiration image FIRST, then prompt
        contents = []

        if inspiration_path and os.path.exists(inspiration_path):
            inspiration_part = load_image_as_part(inspiration_path)
            contents.append(inspiration_part)

        contents.append(prompt)

        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                temperature=1.0,  # Gemini 3 recommendation
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size="2K"
                )
            )
        )

        # Extract image from response
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    return part.inline_data.data

        return None
    except Exception as e:
        print(f"  Generation error: {e}")
        return None


def main(
    inspiration_path: str,
    output_dir: str,
    job_id: str,
    user_prompt: Optional[str] = None,
    project_type: Optional[str] = None,
    suburb: Optional[str] = None,
    feedback: Optional[str] = None
):
    """
    Main workflow for generating a hero image from inspiration.

    Args:
        inspiration_path: Path to the inspiration image
        output_dir: Directory to save output
        job_id: Unique job identifier
        user_prompt: Optional user description
        project_type: Optional project type override
        suburb: Optional suburb override
        feedback: Optional feedback for regeneration
    """
    print(f"Starting inspiration-based hero generation for job {job_id}")
    print(f"Inspiration image: {inspiration_path}")
    print(f"Using model: {IMAGE_MODEL}")

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Determine if this is a regeneration
    is_regeneration = feedback is not None
    status_type = "regenerating_hero" if is_regeneration else "generating_inspiration_hero"

    # Initial status
    update_status(job_id, output_dir, {
        "status": status_type,
        "progress": 5,
        "currentImage": 0,
        "totalImages": 18,
        "flowType": "inspiration",
        "message": "Analyzing inspiration style..." if not is_regeneration else "Regenerating hero with feedback..."
    })

    # Step 1: Analyze inspiration style
    print("\n[1/3] Analyzing inspiration style...")
    style_analysis = analyze_inspiration_style(inspiration_path)

    update_status(job_id, output_dir, {
        "progress": 20,
        "message": "Parsing project requirements..."
    })

    # Step 2: Parse user prompt (if provided)
    print("\n[2/3] Processing project requirements...")
    parsed = parse_user_prompt(user_prompt or "")

    # Override with explicit values if provided
    if project_type:
        parsed["project_type"] = project_type
    if suburb:
        parsed["suburb"] = suburb

    # Get suburb context
    suburb_name = parsed.get("suburb") or suburb or "balwyn"
    suburb_context = build_suburb_context_prompt(suburb_name)

    # Get photorealistic requirements
    photorealistic = build_photorealistic_prompt(
        parsed.get("project_type", "dual_occupancy"),
        "daylight_soft"
    )

    update_status(job_id, output_dir, {
        "progress": 30,
        "message": "Generating hero image..."
    })

    # Step 3: Generate hero image
    print("\n[3/3] Generating hero image from inspiration...")

    # Build the generation prompt
    generation_prompt = build_style_transfer_hero_prompt(
        style_analysis=style_analysis,
        user_prompt=user_prompt or "",
        parsed=parsed,
        suburb_context=suburb_context,
        photorealistic_requirements=photorealistic
    )

    # Add feedback if regenerating
    if feedback:
        generation_prompt = build_regeneration_prompt_with_feedback(
            generation_prompt,
            feedback
        )
        print(f"  Applying user feedback: {feedback[:100]}...")

    # Generate the hero
    hero_image_data = generate_hero_image(
        generation_prompt,
        inspiration_path,
        aspect_ratio="16:9"
    )

    if not hero_image_data:
        print("  ERROR: Failed to generate hero image")
        update_status(job_id, output_dir, {
            "status": "error",
            "message": "Failed to generate hero image from inspiration"
        })
        return

    # Save hero image
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    hero_filename = f"hero_facade_{timestamp}.png"
    hero_path = Path(output_dir) / hero_filename

    with open(hero_path, "wb") as f:
        f.write(hero_image_data)

    print(f"  Saved hero image: {hero_filename}")

    # Copy inspiration image to output dir for reference
    inspiration_ext = Path(inspiration_path).suffix
    inspiration_filename = f"inspiration_{timestamp}{inspiration_ext}"
    inspiration_output_path = Path(output_dir) / inspiration_filename

    import shutil
    shutil.copy2(inspiration_path, inspiration_output_path)
    print(f"  Copied inspiration: {inspiration_filename}")

    # Create/update manifest
    manifest_path = Path(output_dir) / "manifest.json"
    manifest = {
        "job_id": job_id,
        "type": "inspiration_showcase",
        "flowType": "inspiration",
        "prompt": user_prompt or "",
        "parsed": parsed,
        "suburb": suburb_name,
        "model": IMAGE_MODEL,
        "created_at": datetime.now().isoformat(),
        "inspiration": {
            "imagePath": f"/api/images/{job_id}/{inspiration_filename}",
            "filename": inspiration_filename,
            "styleAnalysis": style_analysis
        },
        "hero": {
            "imagePath": f"/api/images/{job_id}/{hero_filename}",
            "filename": hero_filename,
            "generatedAt": datetime.now().isoformat(),
            "attempts": 1
        },
        "images": []
    }

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Update status to awaiting approval
    update_status(job_id, output_dir, {
        "status": "awaiting_approval",
        "progress": 10,
        "currentImage": 1,
        "totalImages": 18,
        "flowType": "inspiration",
        "message": "Hero generated from inspiration - please review and approve",
        "inspiration": {
            "imagePath": f"/api/images/{job_id}/{inspiration_filename}",
            "styleAnalysis": style_analysis
        },
        "hero": {
            "imagePath": f"/api/images/{job_id}/{hero_filename}",
            "filename": hero_filename,
            "generatedAt": datetime.now().isoformat()
        },
        "parsed": parsed
    })

    print(f"\nHero generation complete!")
    print(f"Status: awaiting_approval")
    print(f"Hero image: {hero_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate hero image from inspiration"
    )
    parser.add_argument("inspiration_path", help="Path to inspiration image")
    parser.add_argument("output_dir", help="Directory to save output")
    parser.add_argument("job_id", help="Unique job identifier")
    parser.add_argument(
        "--prompt",
        help="Optional user prompt for guidance"
    )
    parser.add_argument(
        "--project-type",
        choices=["dual_occupancy", "townhouses", "apartments"],
        help="Project type"
    )
    parser.add_argument(
        "--suburb",
        help="Melbourne suburb"
    )
    parser.add_argument(
        "--feedback",
        help="User feedback for regeneration"
    )

    args = parser.parse_args()

    main(
        inspiration_path=args.inspiration_path,
        output_dir=args.output_dir,
        job_id=args.job_id,
        user_prompt=args.prompt,
        project_type=args.project_type,
        suburb=args.suburb,
        feedback=args.feedback
    )
