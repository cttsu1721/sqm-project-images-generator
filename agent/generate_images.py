#!/usr/bin/env python3
"""
Direct image generation script using Google Gemini.
Uses the new google-genai package for image generation.
"""

import json
import os
import sys
import base64
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image
import io

# Load environment variables
load_dotenv()

# Configure Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# Configuration
VERIFICATION_THRESHOLD = int(os.getenv("VERIFICATION_THRESHOLD", "80"))
MAX_REGEN_ATTEMPTS = int(os.getenv("MAX_REGEN_ATTEMPTS", "3"))

# Models
IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation"
VISION_MODEL = "gemini-2.0-flash"

# Variation types to generate
VARIATIONS = [
    {
        "type": "aerial_view",
        "prompt": "Bird's eye view from above, looking down at the building and its surroundings",
    },
    {
        "type": "street_level",
        "prompt": "Ground level perspective looking up at the building facade, pedestrian viewpoint",
    },
    {
        "type": "corner_view",
        "prompt": "45-degree diagonal angle showing two sides of the building",
    },
    {
        "type": "golden_hour",
        "prompt": "Same angle as hero but during golden hour sunset with warm lighting",
    },
    {
        "type": "night_scene",
        "prompt": "Night time view with interior lights on, dramatic lighting",
    },
    {
        "type": "detail_closeup",
        "prompt": "Close-up of an interesting architectural detail, material texture, or design element",
    },
    {
        "type": "with_landscaping",
        "prompt": "Building shown with surrounding landscape, gardens, and environment",
    },
    {
        "type": "with_context",
        "prompt": "Building in its urban or natural context, showing relationship to surroundings",
    }
]


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


def save_image_to_manifest(job_id: str, output_dir: str, image_data: Dict[str, Any]):
    """Add an image to the job manifest."""
    manifest_path = Path(output_dir) / "manifest.json"

    manifest = {"images": [], "job_id": job_id, "created_at": datetime.now().isoformat()}
    if manifest_path.exists():
        with open(manifest_path, "r") as f:
            manifest = json.load(f)

    manifest["images"].append(image_data)
    manifest["updated_at"] = datetime.now().isoformat()

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Also update status with images
    status_path = Path(output_dir) / "status.json"
    if status_path.exists():
        with open(status_path, "r") as f:
            status = json.load(f)
        status["images"] = manifest["images"]
        with open(status_path, "w") as f:
            json.dump(status, f, indent=2)


def load_image_as_part(image_path: str) -> types.Part:
    """Load an image file and convert to Gemini Part."""
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    # Determine mime type
    ext = Path(image_path).suffix.lower()
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
    }
    mime_type = mime_types.get(ext, "image/jpeg")

    return types.Part.from_bytes(data=image_bytes, mime_type=mime_type)


def generate_image(hero_image_path: str, variation: Dict, fixing_prompt: Optional[str] = None) -> Optional[bytes]:
    """Generate a single image variation using Gemini."""
    try:
        prompt = f"""
Generate an architectural visualization based on this reference building.

VARIATION TYPE: {variation['type']}

INSTRUCTIONS:
{variation['prompt']}

REQUIREMENTS:
- The generated image must show the SAME building as the reference
- Maintain architectural consistency: shape, style, materials, windows, proportions
- Professional architecture firm quality
- High quality, photorealistic rendering
"""
        if fixing_prompt:
            prompt += f"\n\nFIXING INSTRUCTIONS:\n{fixing_prompt}"

        # Load hero image as Part
        hero_part = load_image_as_part(hero_image_path)

        # Generate with image output
        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=[prompt, hero_part],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            )
        )

        # Extract image from response
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    return part.inline_data.data

        return None
    except Exception as e:
        print(f"Generation error: {e}")
        return None


def verify_image(hero_image_path: str, generated_image_path: str, variation_type: str) -> Dict:
    """Verify architectural consistency between hero and generated image."""
    try:
        prompt = f"""
Compare these two architectural images:
- Image 1: Original hero/reference image
- Image 2: AI-generated variation ({variation_type})

Score the generated image for architectural consistency:

1. BUILDING SHAPE (0-20): Does the silhouette match?
2. ARCHITECTURAL STYLE (0-20): Same design language?
3. MATERIALS/FACADE (0-20): Similar materials, textures?
4. WINDOWS/OPENINGS (0-20): Pattern and placement match?
5. PROPORTIONS (0-20): Correct scale and dimensions?

Respond in JSON format only:
{{
    "total_score": <0-100>,
    "breakdown": {{
        "building_shape": <0-20>,
        "architectural_style": <0-20>,
        "materials_facade": <0-20>,
        "windows_openings": <0-20>,
        "proportions": <0-20>
    }},
    "issues": ["list of inconsistencies"],
    "suggestions": ["how to fix"]
}}
"""
        hero_part = load_image_as_part(hero_image_path)
        generated_part = load_image_as_part(generated_image_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[prompt, hero_part, generated_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
        )

        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        return json.loads(result_text.strip())
    except Exception as e:
        print(f"Verification error: {e}")
        return {"total_score": 0, "breakdown": {}, "issues": [str(e)], "suggestions": []}


def build_fixing_prompt(verification_result: Dict) -> str:
    """Build a fixing prompt from verification results."""
    lines = []
    breakdown = verification_result.get("breakdown", {})

    for criterion, score in breakdown.items():
        if score < 16:  # Below 80% for this criterion
            lines.append(f"FIX {criterion}: scored {score}/20 - improve this aspect")

    for issue in verification_result.get("issues", []):
        lines.append(f"ISSUE: {issue}")

    for suggestion in verification_result.get("suggestions", []):
        lines.append(f"SUGGESTION: {suggestion}")

    return "\n".join(lines)


def main(hero_image_path: str, output_dir: str, job_id: str):
    """Main generation workflow."""
    print(f"Starting generation for job {job_id}")

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Load hero image
    if not os.path.exists(hero_image_path):
        print(f"Error: Hero image not found: {hero_image_path}")
        update_status(job_id, output_dir, {
            "status": "error",
            "message": "Hero image not found"
        })
        return

    hero_image = Image.open(hero_image_path)
    print(f"Loaded hero image: {hero_image.size}")

    total_variations = len(VARIATIONS)
    completed = 0

    for i, variation in enumerate(VARIATIONS):
        variation_type = variation["type"]
        print(f"\n[{i+1}/{total_variations}] Generating {variation_type}...")

        update_status(job_id, output_dir, {
            "status": "generating",
            "progress": int((i / total_variations) * 100),
            "currentImage": i + 1,
            "totalImages": total_variations,
            "currentVariation": variation_type,
            "message": f"Generating {variation_type.replace('_', ' ')}..."
        })

        attempts = 0
        best_score = 0
        best_image_data = None
        best_breakdown = None
        low_confidence = False

        fixing_prompt = None

        while attempts < MAX_REGEN_ATTEMPTS:
            attempts += 1
            print(f"  Attempt {attempts}/{MAX_REGEN_ATTEMPTS}")

            # Generate image
            image_data = generate_image(hero_image_path, variation, fixing_prompt)

            if not image_data:
                print(f"  Failed to generate image")
                continue

            # Save temporarily for verification
            temp_path = Path(output_dir) / f"temp_{variation_type}.png"
            with open(temp_path, "wb") as f:
                f.write(image_data)

            # Verify
            update_status(job_id, output_dir, {
                "status": "verifying",
                "message": f"Verifying {variation_type.replace('_', ' ')}..."
            })

            verification = verify_image(hero_image_path, str(temp_path), variation_type)
            score = verification.get("total_score", 0)
            print(f"  Verification score: {score}/100")

            if score > best_score:
                best_score = score
                best_image_data = image_data
                best_breakdown = verification.get("breakdown", {})

            if score > VERIFICATION_THRESHOLD:
                print(f"  PASSED (>{VERIFICATION_THRESHOLD}%)")
                # Clean up temp file
                temp_path.unlink(missing_ok=True)
                break
            else:
                print(f"  FAILED (<={VERIFICATION_THRESHOLD}%), building fixing prompt...")
                fixing_prompt = build_fixing_prompt(verification)
                # Clean up temp file
                temp_path.unlink(missing_ok=True)

        # Save the best image we got
        if best_image_data:
            if best_score <= VERIFICATION_THRESHOLD:
                low_confidence = True
                print(f"  Saving as LOW CONFIDENCE (best score: {best_score})")

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{variation_type}_{timestamp}.png"
            final_path = Path(output_dir) / filename

            with open(final_path, "wb") as f:
                f.write(best_image_data)

            # Add to manifest
            image_entry = {
                "id": f"{job_id}_{completed + 1}",
                "filename": filename,
                "url": f"/api/images/{job_id}/{filename}",
                "variationType": variation_type,
                "consistencyScore": best_score,
                "attempts": attempts,
                "lowConfidence": low_confidence,
                "scoreBreakdown": best_breakdown,
                "created_at": datetime.now().isoformat()
            }
            save_image_to_manifest(job_id, output_dir, image_entry)
            completed += 1
            print(f"  Saved: {filename}")
        else:
            print(f"  SKIPPED - no image generated")

    # Final status
    update_status(job_id, output_dir, {
        "status": "complete",
        "progress": 100,
        "currentImage": total_variations,
        "totalImages": total_variations,
        "message": f"Generated {completed} images"
    })

    print(f"\nComplete! Generated {completed}/{total_variations} images")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python generate_images.py <hero_image_path> <output_dir> <job_id>")
        sys.exit(1)

    main(sys.argv[1], sys.argv[2], sys.argv[3])
