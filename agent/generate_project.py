#!/usr/bin/env python3
"""
AI Project Generator - Generate architectural showcase packages from text prompts.

This script generates 18 photorealistic architectural images from a text description,
creating a complete architect's showcase package for property developments.

Updated to follow Google AI best practices:
- Uses Gemini 3 Pro Image Preview model
- XML-structured prompts
- Proper content ordering (image before prompt for references)
- Aspect ratio configuration per shot type
- Temperature 1.0 for Gemini 3
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
    get_all_shots_ordered,
    get_shots_for_project_type,
    build_photorealistic_prompt,
    get_lighting_for_shot,
)

# Configure Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# Configuration
VERIFICATION_THRESHOLD = int(os.getenv("VERIFICATION_THRESHOLD", "80"))
MAX_REGEN_ATTEMPTS = int(os.getenv("MAX_REGEN_ATTEMPTS", "3"))

# Models - Updated to Gemini 3 Pro Image Preview
IMAGE_MODEL = "gemini-3-pro-image-preview"
VISION_MODEL = "gemini-2.0-flash"
TEXT_MODEL = "gemini-2.0-flash"

# System instruction for consistent architectural generation
ARCHITECT_SYSTEM_INSTRUCTION = """You are a professional architectural visualization specialist for SQM Architects, Melbourne.

Your expertise includes:
- Photorealistic architectural photography and rendering
- Melbourne suburban architectural styles and contexts
- Professional real estate photography standards (realestate.com.au quality)
- Maintaining architectural consistency across multiple views of the same building

Key principles:
- Generate images that look like professional DSLR photographs, not CGI renders
- Maintain perfect vertical lines (no keystoning)
- Use realistic Australian lighting conditions
- Include appropriate Melbourne suburban context (vegetation, neighbours, street furniture)
- Ensure material authenticity (real brick textures, timber grain, render finishes)
"""


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

    manifest = {
        "images": [],
        "job_id": job_id,
        "created_at": datetime.now().isoformat(),
        "type": "project_showcase"
    }
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


def parse_user_prompt(prompt: str) -> Dict[str, Any]:
    """
    Parse the user's text prompt to extract project details using Gemini.
    Uses XML-structured prompt for better parsing accuracy.
    """
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
                temperature=1.0,  # Gemini 3 recommendation
            )
        )

        result_text = response.text.strip()
        # Clean markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        parsed = json.loads(result_text.strip())
        # Handle case where LLM returns an array instead of object
        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]
        return parsed
    except Exception as e:
        print(f"Prompt parsing error: {e}")
        # Return defaults
        return {
            "project_type": "dual_occupancy",
            "suburb": None,
            "num_units": 2,
            "storeys": 2,
            "style_keywords": ["modern", "contemporary"],
            "materials": ["brick", "render"],
            "special_features": [],
            "finish_level": "premium",
            "summary": prompt
        }


def build_hero_generation_prompt(
    user_prompt: str,
    parsed: Dict[str, Any],
    suburb_context: str
) -> str:
    """Build XML-structured prompt for generating the primary hero image."""
    materials = ", ".join(parsed.get("materials", ["brick", "render"]))
    style = ", ".join(parsed.get("style_keywords", ["modern"]))
    features = ", ".join(parsed.get("special_features", [])) or "quality architectural detailing"

    prompt = f"""<role>
You are a professional architectural photographer creating a hero image for a Melbourne property development.
</role>

<project>
<description>{user_prompt}</description>
<type>{parsed.get('project_type', 'dual_occupancy').replace('_', ' ').title()}</type>
<units>{parsed.get('num_units', 2)}</units>
<storeys>{parsed.get('storeys', 2)}</storeys>
<style>{style}</style>
<materials>{materials}</materials>
<features>{features}</features>
<finish_level>{parsed.get('finish_level', 'premium').title()}</finish_level>
</project>

<location>
{suburb_context}
</location>

<photorealistic_requirements>
{build_photorealistic_prompt(parsed.get('project_type', 'dual_occupancy'), 'daylight_soft')}
</photorealistic_requirements>

<shot_specification>
<type>Primary Facade - Hero Shot</type>
<camera>
- Eye-level perspective from footpath opposite the building
- 35mm lens equivalent, f/11 aperture for maximum sharpness
- Perfectly straight vertical lines - absolutely NO keystoning or perspective distortion
- Two-point perspective with building centred in frame
</camera>
<composition>
- Full building visible from ground to roofline
- 20-30% sky visible at top of frame
- Front garden, setback, and driveway included
- Street trees or landscaping framing the edges
- Melbourne suburban street context visible
</composition>
<lighting>
- Soft overcast daylight OR morning sun (not harsh midday)
- Even illumination across the facade
- Subtle shadows showing depth and material texture
</lighting>
</shot_specification>

<critical_requirements>
This is the PRIMARY HERO IMAGE that establishes the building design for all subsequent shots.
- Must be the highest quality, most compelling view
- All architectural features must be clearly visible and well-defined
- This image sets the visual standard for the entire 18-image showcase package
- Quality must match professional real estate photography on realestate.com.au
</critical_requirements>

<output>
Generate a single photorealistic exterior photograph of this building.
</output>"""
    return prompt


def build_variation_prompt(
    shot: Dict[str, Any],
    parsed: Dict[str, Any],
    suburb_context: str,
    hero_description: str
) -> str:
    """Build XML-structured prompt for generating variations based on the hero image."""
    lighting = get_lighting_for_shot(shot["id"])

    prompt = f"""<role>
You are a professional architectural photographer creating a variation shot of an existing building.
The reference image shows the EXACT building you must photograph from a different angle/time/focus.
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
CRITICAL - You must show the EXACT SAME BUILDING as the reference image:
- Building shape, silhouette, and massing MUST match exactly
- Materials and facade treatment MUST be identical
- Window patterns, sizes, and placements MUST be consistent
- Architectural style and detailing MUST be the same
- Roof form and materials MUST match
- Only the ANGLE, TIME OF DAY, or FOCUS changes - NOT the building design
</consistency_requirements>

<output>
Generate a single photorealistic photograph showing this exact building from the specified angle/perspective.
</output>"""
    return prompt


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
    # Landscape shots (16:9)
    landscape_shots = [
        "hero_facade", "hero_twilight", "hero_elevated",
        "context_street", "interior_living", "interior_kitchen",
        "interior_master", "lifestyle_morning", "lifestyle_evening",
        # Multi-unit extra shots
        "multi_unit_variety", "multi_shared_spaces"
    ]
    # Square shots (1:1)
    square_shots = ["feature_material"]
    # Portrait shots (3:4)
    portrait_shots = ["spatial_staircase", "spatial_volume"]
    # Standard shots (4:3)
    standard_shots = [
        "context_aerial", "context_approach", "feature_entry",
        "feature_signature", "interior_bathroom", "spatial_window"
    ]

    if shot_id in landscape_shots:
        return "16:9"
    elif shot_id in square_shots:
        return "1:1"
    elif shot_id in portrait_shots:
        return "3:4"
    else:
        return "4:3"


def generate_image(
    prompt: str,
    reference_image_path: Optional[str] = None,
    aspect_ratio: str = "16:9"
) -> Optional[bytes]:
    """
    Generate an image using Gemini 3 Pro Image Preview.

    Best practices applied:
    - Reference image placed BEFORE text prompt in contents
    - Aspect ratio configured via image_config
    - Temperature at 1.0 (Gemini 3 recommendation)
    """
    try:
        # Build contents with proper ordering: image FIRST, then prompt
        # Per docs: "place the text prompt after the image part"
        contents = []

        if reference_image_path and os.path.exists(reference_image_path):
            reference_part = load_image_as_part(reference_image_path)
            contents.append(reference_part)

        contents.append(prompt)

        # Configure with aspect ratio and resolution
        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
                temperature=1.0,  # Gemini 3 recommendation
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size="2K"  # High quality output
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
        print(f"Generation error: {e}")
        return None


def describe_hero_image(image_path: str) -> str:
    """
    Get a detailed description of the hero image for consistency.
    Uses XML-structured prompt and proper content ordering.
    """
    try:
        prompt = """<task>
Describe this architectural photograph in precise detail for use as a reference to ensure consistency in other views of the same building.
</task>

<required_details>
1. Building shape and silhouette (outline, form, massing)
2. Number of storeys and floor-to-floor heights
3. Facade materials with specific details:
   - Brick: colour, bond pattern, texture
   - Render: colour, finish (smooth/textured)
   - Timber: species appearance, orientation (horizontal/vertical)
   - Glass: tinted/clear, frame colours
4. Window patterns: sizes, shapes, placements, frame details
5. Roof form: pitch, materials, colour
6. Entry design: door style, canopy, steps, lighting
7. Architectural style characteristics
8. Distinctive features: cantilevers, screens, voids, balconies
9. Garage doors: style, colour, number
10. Landscaping visible: plants, paving, fencing
</required_details>

<output_format>
Provide a detailed paragraph description that another AI could use to recreate this exact building from a different angle.
Be specific about proportions, colours, and spatial relationships.
</output_format>"""

        # Image FIRST, then prompt (per best practices)
        image_part = load_image_as_part(image_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[image_part, prompt],  # Image before prompt
            config=types.GenerateContentConfig(
                temperature=1.0,  # Gemini 3 recommendation
            )
        )

        return response.text.strip()
    except Exception as e:
        print(f"Description error: {e}")
        return "Modern residential building with quality architectural detailing"


def verify_image(hero_image_path: str, generated_image_path: str, shot_type: str) -> Dict:
    """
    Verify architectural consistency between hero and generated image.
    Uses XML-structured prompt and proper content ordering.
    """
    try:
        prompt = f"""<task>
Compare these two architectural images and score the consistency of the generated image against the reference.
</task>

<images>
- Image 1: Original hero/reference image (the source of truth)
- Image 2: AI-generated variation ({shot_type})
</images>

<scoring_criteria>
Score each criterion from 0-20 points:

1. BUILDING_SHAPE (0-20): Does the silhouette and overall form match?
2. ARCHITECTURAL_STYLE (0-20): Is the design language consistent?
3. MATERIALS_FACADE (0-20): Are materials, colours, and textures the same?
4. WINDOWS_OPENINGS (0-20): Do window patterns and placements match?
5. PROPORTIONS (0-20): Are scale and dimensional relationships correct?
</scoring_criteria>

<output_format>
Return ONLY a JSON object:
{{
    "total_score": <sum of all criteria, 0-100>,
    "breakdown": {{
        "building_shape": <0-20>,
        "architectural_style": <0-20>,
        "materials_facade": <0-20>,
        "windows_openings": <0-20>,
        "proportions": <0-20>
    }},
    "issues": ["list specific inconsistencies found"],
    "suggestions": ["specific fixes to improve consistency"]
}}
</output_format>"""

        # Images FIRST, then prompt (per best practices)
        hero_part = load_image_as_part(hero_image_path)
        generated_part = load_image_as_part(generated_image_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[hero_part, generated_part, prompt],  # Images before prompt
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=1.0,  # Gemini 3 recommendation
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


def verify_interior_image(
    hero_image_path: str,
    generated_image_path: str,
    shot_type: str,
    parsed: Dict[str, Any]
) -> Dict:
    """
    Verify interior image consistency with project style, not exterior building shape.
    Interior shots should be verified for style/quality match, not building facade.
    Uses XML-structured prompt and proper content ordering.
    """
    try:
        # Extract project context for interior verification
        project_type = parsed.get("project_type", "dual_occupancy")
        style_keywords = ", ".join(parsed.get("style_keywords", ["modern"]))
        materials = ", ".join(parsed.get("materials", ["brick", "render"]))
        finish_level = parsed.get("finish_level", "premium")

        prompt = f"""<task>
Analyze this interior image for quality and style consistency with the project.
</task>

<context>
- Image 1: EXTERIOR of a {project_type.replace('_', ' ')} building (style reference only)
- Image 2: INTERIOR space ({shot_type}) - this is what you are scoring
</context>

<project_details>
<type>{project_type.replace('_', ' ').title()}</type>
<style_keywords>{style_keywords}</style_keywords>
<exterior_materials>{materials}</exterior_materials>
<finish_level>{finish_level.title()}</finish_level>
</project_details>

<important_note>
Interior shots naturally look different from exteriors. Do NOT check for building shape or facade consistency.
Instead, verify style and quality consistency.
</important_note>

<scoring_criteria>
Score each criterion from 0-20 points:

1. INTERIOR_STYLE_CONSISTENCY (0-20):
   - Does the interior style match the exterior's architectural language?
   - Modern exterior = modern interior, traditional = traditional, etc.
   - Are design language cues consistent (clean lines, materials, details)?

2. MATERIAL_FINISH_QUALITY (0-20):
   - Does the finish level match the project brief ({finish_level})?
   - Are materials appropriate for the stated finish level?
   - Premium exterior shouldn't have budget interior, and vice versa.

3. LIGHTING_APPROPRIATENESS (0-20):
   - Is the lighting quality photorealistic?
   - Does it match Melbourne residential standards?
   - Is natural light handled realistically?

4. SPATIAL_QUALITY (0-20):
   - Do room proportions feel appropriate for the project type?
   - Is the space representative of this development type?
   - Does ceiling height/room size match expectations?

5. PROJECT_CONTEXT_MATCH (0-20):
   - Does this interior "belong" to this building?
   - Is there a cohesive design story between exterior and interior?
   - Is it appropriate for the market level?
</scoring_criteria>

<output_format>
Return ONLY a JSON object:
{{
    "total_score": <sum of all criteria, 0-100>,
    "breakdown": {{
        "interior_style_consistency": <0-20>,
        "material_finish_quality": <0-20>,
        "lighting_appropriateness": <0-20>,
        "spatial_quality": <0-20>,
        "project_context_match": <0-20>
    }},
    "issues": ["list specific issues found"],
    "suggestions": ["specific improvements to make"]
}}
</output_format>"""

        # Images FIRST, then prompt (per best practices)
        hero_part = load_image_as_part(hero_image_path)
        generated_part = load_image_as_part(generated_image_path)

        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[hero_part, generated_part, prompt],  # Images before prompt
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=1.0,  # Gemini 3 recommendation
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
        return {"total_score": 0, "breakdown": {}, "issues": [str(e)], "suggestions": []}


def build_fixing_prompt(verification_result: Dict) -> str:
    """Build an XML-structured fixing prompt from verification results."""
    lines = ["<fixes_required>"]
    breakdown = verification_result.get("breakdown", {})

    for criterion, score in breakdown.items():
        if score < 16:  # Below 80% for this criterion
            lines.append(f"<fix criterion='{criterion}' score='{score}/20'>Improve this aspect significantly</fix>")

    for issue in verification_result.get("issues", []):
        lines.append(f"<issue>{issue}</issue>")

    for suggestion in verification_result.get("suggestions", []):
        lines.append(f"<suggestion>{suggestion}</suggestion>")

    lines.append("</fixes_required>")
    return "\n".join(lines)


def main(
    user_prompt: str,
    output_dir: str,
    job_id: str,
    project_type: Optional[str] = None,
    suburb_override: Optional[str] = None,
    from_hero: Optional[str] = None
):
    """Main generation workflow.

    Args:
        user_prompt: The user's text description of the project
        output_dir: Directory to save generated images
        job_id: Unique job identifier
        project_type: Optional override for project type (from dropdown)
        suburb_override: Optional override for suburb (from dropdown)
        from_hero: Optional path to pre-approved hero image (skips hero generation)
    """
    print(f"Starting project generation for job {job_id}")
    print(f"User prompt: {user_prompt[:100]}...")
    print(f"Using model: {IMAGE_MODEL}")
    if project_type:
        print(f"Project type (from dropdown): {project_type}")
    if suburb_override:
        print(f"Suburb (from dropdown): {suburb_override}")
    if from_hero:
        print(f"Using pre-approved hero: {from_hero}")

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Initial status
    update_status(job_id, output_dir, {
        "status": "parsing",
        "progress": 2,
        "currentImage": 0,
        "totalImages": 18,
        "message": "Analyzing project description...",
        "prompt": user_prompt,
        "model": IMAGE_MODEL
    })

    # Parse user prompt
    print("\n[1/4] Parsing user prompt...")
    parsed = parse_user_prompt(user_prompt)

    # Override with dropdown values if provided
    if project_type:
        parsed["project_type"] = project_type
        print(f"  Project type (override): {project_type}")
    else:
        print(f"  Project type (parsed): {parsed.get('project_type')}")

    if suburb_override:
        parsed["suburb"] = suburb_override
        print(f"  Suburb (override): {suburb_override}")
    else:
        print(f"  Suburb (parsed): {parsed.get('suburb')}")

    print(f"  Style: {parsed.get('style_keywords')}")

    # Determine total shots based on project type (multi-unit gets +2 extra)
    project_type_final = parsed.get("project_type", "dual_occupancy")
    num_units = parsed.get("num_units", 2) or 2
    shots_list = get_shots_for_project_type(project_type_final, num_units)
    total_shots = len(shots_list)

    # Check if multi-unit project
    is_multi_unit = project_type_final == "apartments" or (
        project_type_final == "townhouses" and num_units >= 3
    )
    if is_multi_unit:
        print(f"  Multi-unit project detected: {total_shots} images (18 base + 2 multi-unit)")
    else:
        print(f"  Standard project: {total_shots} images")

    # Update status with correct total
    update_status(job_id, output_dir, {
        "totalImages": total_shots,
        "message": "Project parsed, starting generation..."
    })

    # Get suburb context
    suburb = parsed.get("suburb") or "balwyn"  # Default to Balwyn (SQM's area)
    suburb_context = build_suburb_context_prompt(suburb)

    # Save parsed info to manifest
    manifest_path = Path(output_dir) / "manifest.json"
    manifest = {
        "job_id": job_id,
        "type": "project_showcase",
        "prompt": user_prompt,
        "parsed": parsed,
        "suburb": suburb,
        "model": IMAGE_MODEL,
        "created_at": datetime.now().isoformat(),
        "images": []
    }
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Generate or use pre-approved hero image
    hero_aspect_ratio = get_aspect_ratio_for_shot("hero_facade")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if from_hero and os.path.exists(from_hero):
        # Use pre-approved hero image (from inspiration flow)
        print("\n[2/4] Using pre-approved hero image...")
        update_status(job_id, output_dir, {
            "status": "generating",
            "progress": 10,
            "currentImage": 1,
            "totalImages": total_shots,
            "currentVariation": "hero_facade",
            "message": "Using approved hero image..."
        })

        hero_path = Path(from_hero)
        hero_filename = hero_path.name

        # If hero is not already in output dir, copy it
        output_hero_path = Path(output_dir) / hero_filename
        if str(hero_path) != str(output_hero_path):
            import shutil
            shutil.copy2(hero_path, output_hero_path)
            hero_path = output_hero_path

        print(f"  Using hero image: {hero_filename}")

        # Add hero to manifest (it may already be there from inspiration flow)
        hero_entry = {
            "id": f"{job_id}_1",
            "filename": hero_filename,
            "url": f"/api/images/{job_id}/{hero_filename}",
            "variationType": "hero_facade",
            "category": "hero_shots",
            "name": "Primary Facade",
            "isHero": True,
            "consistencyScore": 100,
            "attempts": 1,
            "lowConfidence": False,
            "aspectRatio": hero_aspect_ratio,
            "created_at": datetime.now().isoformat()
        }

        # Check if manifest already has images (from inspiration flow)
        manifest_path = Path(output_dir) / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                existing_manifest = json.load(f)
            # Only add hero if not already in images
            if not any(img.get("isHero") for img in existing_manifest.get("images", [])):
                save_image_to_manifest(job_id, output_dir, hero_entry)
        else:
            save_image_to_manifest(job_id, output_dir, hero_entry)

    else:
        # Generate new hero image
        print("\n[2/4] Generating hero image...")
        update_status(job_id, output_dir, {
            "status": "generating_hero",
            "progress": 5,
            "currentImage": 1,
            "totalImages": 18,
            "currentVariation": "hero_facade",
            "message": "Generating primary facade (hero image)..."
        })

        hero_prompt = build_hero_generation_prompt(user_prompt, parsed, suburb_context)
        hero_image_data = generate_image(hero_prompt, aspect_ratio=hero_aspect_ratio)

        if not hero_image_data:
            print("  ERROR: Failed to generate hero image")
            update_status(job_id, output_dir, {
                "status": "error",
                "message": "Failed to generate hero image"
            })
            return

        # Save hero image
        hero_filename = f"hero_facade_{timestamp}.png"
        hero_path = Path(output_dir) / hero_filename

        with open(hero_path, "wb") as f:
            f.write(hero_image_data)

        print(f"  Saved hero image: {hero_filename}")

        # Add hero to manifest
        hero_entry = {
            "id": f"{job_id}_1",
            "filename": hero_filename,
            "url": f"/api/images/{job_id}/{hero_filename}",
            "variationType": "hero_facade",
            "category": "hero_shots",
            "name": "Primary Facade",
            "isHero": True,
            "consistencyScore": 100,  # Hero is always 100% consistent with itself
            "attempts": 1,
            "lowConfidence": False,
            "aspectRatio": hero_aspect_ratio,
            "created_at": datetime.now().isoformat()
        }
        save_image_to_manifest(job_id, output_dir, hero_entry)

    # Get hero description for consistency
    print("\n[3/4] Analyzing hero image for consistency reference...")
    hero_description = describe_hero_image(str(hero_path))
    print(f"  Description: {hero_description[:200]}...")

    # Generate remaining shots
    print("\n[4/4] Generating showcase package...")
    # Use pre-calculated shots_list (includes multi-unit extras if applicable)
    completed = 1  # Hero already done

    for i, shot in enumerate(shots_list):
        # Skip hero_facade as it's already done
        if shot["id"] == "hero_facade":
            continue

        shot_name = shot["name"]
        shot_id = shot["id"]
        category = shot["category"]
        aspect_ratio = get_aspect_ratio_for_shot(shot_id)

        print(f"\n[{completed + 1}/{total_shots}] Generating {shot_name} ({aspect_ratio})...")

        update_status(job_id, output_dir, {
            "status": "generating",
            "progress": int((completed / total_shots) * 100),
            "currentImage": completed + 1,
            "totalImages": total_shots,
            "currentVariation": shot_id,
            "message": f"Generating {shot_name}..."
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

            # Build variation prompt
            variation_prompt = build_variation_prompt(shot, parsed, suburb_context, hero_description)

            if fixing_prompt:
                variation_prompt += f"\n\n{fixing_prompt}"

            # Generate image with hero as reference
            image_data = generate_image(
                variation_prompt,
                str(hero_path),
                aspect_ratio=aspect_ratio
            )

            if not image_data:
                print(f"  Failed to generate image")
                continue

            # Save temporarily for verification
            temp_path = Path(output_dir) / f"temp_{shot_id}.png"
            with open(temp_path, "wb") as f:
                f.write(image_data)

            # Verify consistency with hero
            # Use different verification criteria for interior shots
            update_status(job_id, output_dir, {
                "status": "verifying",
                "message": f"Verifying {shot_name}..."
            })

            if is_interior_shot(shot_id):
                # Interior shots: verify style/quality consistency, not building shape
                verification = verify_interior_image(str(hero_path), str(temp_path), shot_id, parsed)
                print(f"  [Interior verification - style/quality criteria]")
            else:
                # Exterior shots: verify building shape/facade consistency
                verification = verify_image(str(hero_path), str(temp_path), shot_id)
            score = verification.get("total_score", 0)
            print(f"  Verification score: {score}/100")

            if score > best_score:
                best_score = score
                best_image_data = image_data
                best_breakdown = verification.get("breakdown", {})

            # Clean up temp file
            temp_path.unlink(missing_ok=True)

            if score > VERIFICATION_THRESHOLD:
                print(f"  PASSED (>{VERIFICATION_THRESHOLD}%)")
                break
            else:
                print(f"  FAILED (<={VERIFICATION_THRESHOLD}%), building fixing prompt...")
                fixing_prompt = build_fixing_prompt(verification)

        # Save the best image we got
        if best_image_data:
            if best_score <= VERIFICATION_THRESHOLD:
                low_confidence = True
                print(f"  Saving as LOW CONFIDENCE (best score: {best_score})")

            filename = f"{shot_id}_{timestamp}.png"
            final_path = Path(output_dir) / filename

            with open(final_path, "wb") as f:
                f.write(best_image_data)

            # Add to manifest
            image_entry = {
                "id": f"{job_id}_{completed + 1}",
                "filename": filename,
                "url": f"/api/images/{job_id}/{filename}",
                "variationType": shot_id,
                "category": category,
                "name": shot_name,
                "isHero": False,
                "consistencyScore": best_score,
                "attempts": attempts,
                "lowConfidence": low_confidence,
                "scoreBreakdown": best_breakdown,
                "aspectRatio": aspect_ratio,
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
        "currentImage": total_shots,
        "totalImages": total_shots,
        "message": f"Generated {completed} images"
    })

    print(f"\nComplete! Generated {completed}/{total_shots} images")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate architectural showcase images from text prompts"
    )
    parser.add_argument("prompt", help="User's text description of the project")
    parser.add_argument("output_dir", help="Directory to save generated images")
    parser.add_argument("job_id", help="Unique job identifier")
    parser.add_argument(
        "--project-type",
        choices=["dual_occupancy", "townhouses", "apartments"],
        help="Override project type (from dropdown selection)"
    )
    parser.add_argument(
        "--suburb",
        help="Override suburb (from dropdown selection)"
    )
    parser.add_argument(
        "--from-hero",
        help="Path to pre-approved hero image (skips hero generation)"
    )

    args = parser.parse_args()

    main(
        user_prompt=args.prompt,
        output_dir=args.output_dir,
        job_id=args.job_id,
        project_type=args.project_type,
        suburb_override=args.suburb,
        from_hero=args.from_hero
    )
