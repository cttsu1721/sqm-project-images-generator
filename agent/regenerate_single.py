#!/usr/bin/env python3
"""
Single Image Regeneration Script

Regenerates a single image from an existing job, using the hero image as reference.
Used for fixing low-confidence images without regenerating the entire showcase.
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
    get_shot_by_id,
    build_photorealistic_prompt,
    get_lighting_for_shot,
)

# Configure Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# Configuration
VERIFICATION_THRESHOLD = int(os.getenv("VERIFICATION_THRESHOLD", "80"))
MAX_REGEN_ATTEMPTS = int(os.getenv("MAX_REGEN_ATTEMPTS", "3"))

# Models
IMAGE_MODEL = "gemini-3-pro-image-preview"
VISION_MODEL = "gemini-2.0-flash"

# Interior shot IDs that need different verification criteria
INTERIOR_SHOT_IDS = [
    "interior_living",
    "interior_kitchen",
    "interior_master",
    "interior_bathroom",
    "spatial_staircase",
    "spatial_window",
    "spatial_volume",
    "lifestyle_morning",
    "lifestyle_evening",
]


def is_interior_shot(shot_id: str) -> bool:
    """Check if a shot type is an interior shot."""
    return shot_id in INTERIOR_SHOT_IDS


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


def get_aspect_ratio_for_shot(shot_id: str) -> str:
    """Get the appropriate aspect ratio for each shot type."""
    landscape_shots = [
        "hero_facade", "hero_twilight", "hero_elevated",
        "context_street", "interior_living", "interior_kitchen",
        "interior_master", "lifestyle_morning", "lifestyle_evening",
        "multi_unit_variety", "multi_shared_spaces"
    ]
    square_shots = ["feature_material"]
    portrait_shots = ["spatial_staircase", "spatial_volume"]

    if shot_id in landscape_shots:
        return "16:9"
    elif shot_id in square_shots:
        return "1:1"
    elif shot_id in portrait_shots:
        return "3:4"
    else:
        return "4:3"


def describe_hero_image(image_path: str) -> str:
    """Get a detailed description of the hero image for consistency."""
    try:
        prompt = """<task>
Describe this architectural photograph in precise detail for use as a reference.
</task>

<required_details>
1. Building shape and silhouette
2. Number of storeys
3. Facade materials (brick, render, timber, glass)
4. Window patterns and placements
5. Roof form and materials
6. Entry design
7. Architectural style
8. Distinctive features
</required_details>

<output_format>
Provide a detailed paragraph description.
</output_format>"""

        image_part = load_image_as_part(image_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(temperature=1.0)
        )

        return response.text.strip()
    except Exception as e:
        print(f"Description error: {e}")
        return "Modern residential building with quality architectural detailing"


def build_variation_prompt(
    shot: Dict[str, Any],
    parsed: Dict[str, Any],
    suburb_context: str,
    hero_description: str
) -> str:
    """Build prompt for generating variation based on the hero image."""
    lighting = get_lighting_for_shot(shot["id"])

    prompt = f"""<role>
You are a professional architectural photographer creating a variation shot of an existing building.
</role>

<reference_building>
{hero_description}
</reference_building>

<project>
<type>{parsed.get('project_type', 'dual_occupancy').replace('_', ' ').title()}</type>
<style>{', '.join(parsed.get('style_keywords', ['modern']))}</style>
<materials>{', '.join(parsed.get('materials', ['brick', 'render']))}</materials>
</project>

<location>
{suburb_context}
</location>

<photorealistic_requirements>
{build_photorealistic_prompt(parsed.get('project_type', 'dual_occupancy'), lighting)}
</photorealistic_requirements>

<shot_specification>
{shot['prompt']}
</shot_specification>

<consistency_requirements>
CRITICAL - Show the EXACT SAME BUILDING as the reference:
- Building shape, silhouette, and massing MUST match exactly
- Materials and facade treatment MUST be identical
- Window patterns, sizes, and placements MUST be consistent
- Architectural style and detailing MUST be the same
</consistency_requirements>

<output>
Generate a single photorealistic photograph showing this exact building.
</output>"""
    return prompt


def generate_image(
    prompt: str,
    reference_image_path: Optional[str] = None,
    aspect_ratio: str = "16:9"
) -> Optional[bytes]:
    """Generate an image using Gemini."""
    try:
        contents = []

        if reference_image_path and os.path.exists(reference_image_path):
            reference_part = load_image_as_part(reference_image_path)
            contents.append(reference_part)

        contents.append(prompt)

        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                temperature=1.0,
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size="2K"
                )
            )
        )

        if response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    return part.inline_data.data

        return None
    except Exception as e:
        print(f"Generation error: {e}")
        return None


def verify_image(hero_path: str, generated_path: str, shot_type: str) -> Dict:
    """Verify architectural consistency between hero and generated image."""
    try:
        prompt = f"""<task>
Compare these two architectural images and score consistency.
</task>

<images>
- Image 1: Reference hero image
- Image 2: Generated variation ({shot_type})
</images>

<scoring_criteria>
Score each 0-20:
1. BUILDING_SHAPE: Does silhouette match?
2. ARCHITECTURAL_STYLE: Is design language consistent?
3. MATERIALS_FACADE: Are materials the same?
4. WINDOWS_OPENINGS: Do patterns match?
5. PROPORTIONS: Are relationships correct?
</scoring_criteria>

<output_format>
Return ONLY JSON:
{{
    "total_score": <0-100>,
    "breakdown": {{...}},
    "issues": [...],
    "suggestions": [...]
}}
</output_format>"""

        hero_part = load_image_as_part(hero_path)
        generated_part = load_image_as_part(generated_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[hero_part, generated_part, prompt],
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

        return json.loads(result_text.strip())
    except Exception as e:
        print(f"Verification error: {e}")
        return {"total_score": 0, "breakdown": {}, "issues": [str(e)]}


def verify_interior_image(
    hero_path: str,
    generated_path: str,
    shot_type: str,
    parsed: Dict[str, Any]
) -> Dict:
    """Verify interior image for style/quality consistency."""
    try:
        project_type = parsed.get("project_type", "dual_occupancy")
        style_keywords = ", ".join(parsed.get("style_keywords", ["modern"]))
        finish_level = parsed.get("finish_level", "premium")

        prompt = f"""<task>
Analyze this interior image for style and quality consistency.
</task>

<context>
- Image 1: EXTERIOR reference (style only)
- Image 2: INTERIOR ({shot_type}) - scoring this
</context>

<project>
<type>{project_type.replace('_', ' ').title()}</type>
<style>{style_keywords}</style>
<finish_level>{finish_level.title()}</finish_level>
</project>

<note>
Interior shots look different from exteriors. Score style/quality, not building shape.
</note>

<scoring_criteria>
Score each 0-20:
1. INTERIOR_STYLE_CONSISTENCY: Does style match?
2. MATERIAL_FINISH_QUALITY: Appropriate finish level?
3. LIGHTING_APPROPRIATENESS: Photorealistic?
4. SPATIAL_QUALITY: Good proportions?
5. PROJECT_CONTEXT_MATCH: Belongs to this building?
</scoring_criteria>

<output_format>
Return ONLY JSON:
{{
    "total_score": <0-100>,
    "breakdown": {{...}},
    "issues": [...],
    "suggestions": [...]
}}
</output_format>"""

        hero_part = load_image_as_part(hero_path)
        generated_part = load_image_as_part(generated_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[hero_part, generated_part, prompt],
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

        return json.loads(result_text.strip())
    except Exception as e:
        print(f"Interior verification error: {e}")
        return {"total_score": 0, "breakdown": {}, "issues": [str(e)]}


def build_fixing_prompt(verification_result: Dict) -> str:
    """Build fixing prompt from verification results."""
    lines = ["<fixes_required>"]
    breakdown = verification_result.get("breakdown", {})

    for criterion, score in breakdown.items():
        if score < 16:
            lines.append(f"<fix criterion='{criterion}' score='{score}/20'>Improve this</fix>")

    for issue in verification_result.get("issues", []):
        lines.append(f"<issue>{issue}</issue>")

    for suggestion in verification_result.get("suggestions", []):
        lines.append(f"<suggestion>{suggestion}</suggestion>")

    lines.append("</fixes_required>")
    return "\n".join(lines)


def update_manifest(output_dir: str, variation_type: str, new_image_data: Dict):
    """Update manifest with regenerated image."""
    manifest_path = Path(output_dir) / "manifest.json"

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    # Find and replace the image entry
    for i, img in enumerate(manifest.get("images", [])):
        if img.get("variationType") == variation_type:
            # Preserve the original ID
            new_image_data["id"] = img["id"]
            manifest["images"][i] = new_image_data
            break

    manifest["updated_at"] = datetime.now().isoformat()

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Also update status.json
    status_path = Path(output_dir) / "status.json"
    if status_path.exists():
        with open(status_path, "r") as f:
            status = json.load(f)
        status["images"] = manifest["images"]
        with open(status_path, "w") as f:
            json.dump(status, f, indent=2)


def main(job_id: str, variation_type: str, output_dir: str):
    """Regenerate a single image."""
    print(f"Regenerating {variation_type} for job {job_id}")

    # Load manifest
    manifest_path = Path(output_dir) / "manifest.json"
    if not manifest_path.exists():
        print("ERROR: Manifest not found")
        sys.exit(1)

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    parsed = manifest.get("parsed", {})
    suburb = manifest.get("suburb", "balwyn")

    # Get shot definition
    shot = get_shot_by_id(variation_type)
    if not shot:
        print(f"ERROR: Unknown shot type: {variation_type}")
        sys.exit(1)

    # Find hero image
    hero_image = None
    for img in manifest.get("images", []):
        if img.get("isHero"):
            hero_image = img
            break

    if not hero_image:
        print("ERROR: Hero image not found in manifest")
        sys.exit(1)

    hero_path = Path(output_dir) / hero_image["filename"]
    if not hero_path.exists():
        print(f"ERROR: Hero image file not found: {hero_path}")
        sys.exit(1)

    # Get suburb context
    suburb_context = build_suburb_context_prompt(suburb)

    # Get hero description
    print("Analyzing hero image...")
    hero_description = describe_hero_image(str(hero_path))

    # Get aspect ratio
    aspect_ratio = get_aspect_ratio_for_shot(variation_type)

    # Generation loop
    attempts = 0
    best_score = 0
    best_image_data = None
    best_breakdown = None
    fixing_prompt = None

    while attempts < MAX_REGEN_ATTEMPTS:
        attempts += 1
        print(f"Attempt {attempts}/{MAX_REGEN_ATTEMPTS}")

        # Build prompt
        variation_prompt = build_variation_prompt(shot, parsed, suburb_context, hero_description)

        if fixing_prompt:
            variation_prompt += f"\n\n{fixing_prompt}"

        # Generate image
        image_data = generate_image(
            variation_prompt,
            str(hero_path),
            aspect_ratio=aspect_ratio
        )

        if not image_data:
            print("  Failed to generate image")
            continue

        # Save temporarily for verification
        temp_path = Path(output_dir) / f"temp_regen_{variation_type}.png"
        with open(temp_path, "wb") as f:
            f.write(image_data)

        # Verify
        print("  Verifying...")
        if is_interior_shot(variation_type):
            verification = verify_interior_image(str(hero_path), str(temp_path), variation_type, parsed)
            print("  [Interior verification - style/quality criteria]")
        else:
            verification = verify_image(str(hero_path), str(temp_path), variation_type)

        score = verification.get("total_score", 0)
        print(f"  Score: {score}/100")

        if score > best_score:
            best_score = score
            best_image_data = image_data
            best_breakdown = verification.get("breakdown", {})

        # Clean up temp
        temp_path.unlink(missing_ok=True)

        if score > VERIFICATION_THRESHOLD:
            print(f"  PASSED (>{VERIFICATION_THRESHOLD}%)")
            break
        else:
            print(f"  FAILED, building fixing prompt...")
            fixing_prompt = build_fixing_prompt(verification)

    # Save best image
    if best_image_data:
        low_confidence = best_score <= VERIFICATION_THRESHOLD
        if low_confidence:
            print(f"Saving as LOW CONFIDENCE (best score: {best_score})")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{variation_type}_{timestamp}.png"
        final_path = Path(output_dir) / filename

        with open(final_path, "wb") as f:
            f.write(best_image_data)

        # Update manifest
        image_entry = {
            "filename": filename,
            "url": f"/api/images/{job_id}/{filename}",
            "variationType": variation_type,
            "category": shot["category"],
            "name": shot["name"],
            "isHero": False,
            "consistencyScore": best_score,
            "attempts": attempts,
            "lowConfidence": low_confidence,
            "scoreBreakdown": best_breakdown,
            "aspectRatio": aspect_ratio,
            "regenerated_at": datetime.now().isoformat()
        }
        update_manifest(output_dir, variation_type, image_entry)

        print(f"Saved: {filename}")
        print("Regeneration complete!")
    else:
        print("ERROR: No image was generated")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Regenerate a single image from an existing job"
    )
    parser.add_argument("job_id", help="Job ID")
    parser.add_argument("variation_type", help="Shot type to regenerate")
    parser.add_argument("output_dir", help="Output directory path")

    args = parser.parse_args()
    main(args.job_id, args.variation_type, args.output_dir)
