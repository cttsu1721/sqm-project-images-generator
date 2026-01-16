"""
AI Verification Tool

Custom tool for Claude Agent SDK that verifies architectural consistency
between a generated image and the hero reference image.
"""

import os
import json
from typing import Optional

import google.generativeai as genai
from PIL import Image

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# Use Gemini Pro for vision comparison (faster than image generation model)
VISION_MODEL = "gemini-2.0-flash"

# Verification threshold (configurable via env)
VERIFICATION_THRESHOLD = int(os.getenv("VERIFICATION_THRESHOLD", "80"))

# Interior shot IDs that should use interior-specific verification
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


async def verify_consistency(
    hero_image_path: str,
    generated_image_path: str,
    variation_type: str
) -> dict:
    """
    Verify architectural consistency between generated image and hero.

    Uses Gemini vision capabilities to compare the two images and score
    the generated image across 5 architectural criteria.

    Args:
        hero_image_path: Path to the original hero image
        generated_image_path: Path to the generated variation
        variation_type: Type of variation for context

    Returns:
        dict with:
            - total_score: Overall consistency score (0-100)
            - breakdown: Score for each criterion (0-20 each)
            - pass: Whether score > threshold
            - issues: List of specific inconsistencies found
            - suggestions: How to fix for regeneration
            - fixing_prompt: Ready-to-use prompt for regeneration
    """
    try:
        # Load both images
        if not os.path.exists(hero_image_path):
            return {
                "success": False,
                "error": f"Hero image not found: {hero_image_path}"
            }

        if not os.path.exists(generated_image_path):
            return {
                "success": False,
                "error": f"Generated image not found: {generated_image_path}"
            }

        hero_image = Image.open(hero_image_path)
        generated_image = Image.open(generated_image_path)

        # Build comparison prompt
        comparison_prompt = f"""
        You are an architectural consistency expert. Compare these two images:

        Image 1 (LEFT): Original hero/reference image of a building
        Image 2 (RIGHT): AI-generated variation ({variation_type})

        Analyze the generated image for architectural consistency with the original.

        SCORING CRITERIA (0-20 points each, total 100):

        1. BUILDING SHAPE (0-20):
           - Does the overall silhouette match?
           - Is the building footprint correct?
           - Are roof lines and angles preserved?
           Score higher if the shape is recognizably the same building.

        2. ARCHITECTURAL STYLE (0-20):
           - Is the design language consistent? (modern, traditional, etc.)
           - Are architectural details preserved?
           - Does it feel like the same architect designed both?

        3. MATERIALS/FACADE (0-20):
           - Are the facade materials similar? (glass, concrete, brick, timber)
           - Is the color palette appropriate?
           - Are surface textures consistent?

        4. WINDOWS/OPENINGS (0-20):
           - Do window patterns match?
           - Are window sizes and shapes similar?
           - Are entry points/doors in correct positions?

        5. PROPORTIONS (0-20):
           - Is the height-to-width ratio correct?
           - Are floor heights consistent?
           - Does the scale feel right?

        RESPOND IN VALID JSON FORMAT ONLY:
        {{
            "total_score": <sum of all scores 0-100>,
            "breakdown": {{
                "building_shape": <0-20>,
                "architectural_style": <0-20>,
                "materials_facade": <0-20>,
                "windows_openings": <0-20>,
                "proportions": <0-20>
            }},
            "issues": [
                "List each specific inconsistency found",
                "Be specific: 'roof angle is 30 degrees instead of 45'"
            ],
            "suggestions": [
                "Specific suggestions to fix each issue",
                "E.g., 'Make the corners more angular to match the modern style'"
            ]
        }}

        Be strict but fair. The variation type is '{variation_type}' so expect
        different angle/lighting, but the BUILDING itself must be consistent.
        """

        # Create the model
        model = genai.GenerativeModel(VISION_MODEL)

        # Generate comparison analysis
        response = model.generate_content(
            contents=[comparison_prompt, hero_image, generated_image],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,  # Low temperature for consistent scoring
            )
        )

        # Parse the JSON response
        result_text = response.text.strip()

        # Handle potential markdown code blocks
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]

        result = json.loads(result_text.strip())

        # Determine pass/fail
        total_score = result.get("total_score", 0)
        passed = total_score > VERIFICATION_THRESHOLD

        # Build fixing prompt for regeneration if needed
        fixing_prompt = None
        if not passed:
            fixing_lines = []
            breakdown = result.get("breakdown", {})

            for criterion, score in breakdown.items():
                if score < 16:  # Below 80% for this criterion
                    # Find related issue
                    related_issues = [
                        issue for issue in result.get("issues", [])
                        if criterion.replace("_", " ").lower() in issue.lower()
                    ]
                    fixing_lines.append(
                        f"FIX {criterion}: scored {score}/20 - {related_issues[0] if related_issues else 'improve this aspect'}"
                    )

            for suggestion in result.get("suggestions", []):
                fixing_lines.append(f"SUGGESTION: {suggestion}")

            fixing_prompt = "\n".join(fixing_lines)

        return {
            "success": True,
            "total_score": total_score,
            "breakdown": result.get("breakdown", {}),
            "pass": passed,
            "threshold": VERIFICATION_THRESHOLD,
            "issues": result.get("issues", []),
            "suggestions": result.get("suggestions", []),
            "fixing_prompt": fixing_prompt
        }

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse verification response: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Verification error: {str(e)}"
        }


async def verify_interior_consistency(
    hero_image_path: str,
    generated_image_path: str,
    variation_type: str,
    parsed_project: dict
) -> dict:
    """
    Verify interior image consistency with project style, not exterior shape.

    Interior shots should not be verified for building shape/facade consistency
    since they show different spaces. Instead, verify style and quality consistency.

    Args:
        hero_image_path: Path to the exterior hero image (for style reference)
        generated_image_path: Path to the generated interior image
        variation_type: Type of interior shot
        parsed_project: Parsed project info with style_keywords, materials, finish_level

    Returns:
        dict with:
            - total_score: Overall consistency score (0-100)
            - breakdown: Score for each interior criterion (0-20 each)
            - pass: Whether score > threshold
            - issues: List of specific issues found
            - suggestions: How to fix for regeneration
    """
    try:
        if not os.path.exists(hero_image_path):
            return {
                "success": False,
                "error": f"Hero image not found: {hero_image_path}"
            }

        if not os.path.exists(generated_image_path):
            return {
                "success": False,
                "error": f"Generated image not found: {generated_image_path}"
            }

        hero_image = Image.open(hero_image_path)
        generated_image = Image.open(generated_image_path)

        # Extract project context
        project_type = parsed_project.get("project_type", "residential")
        style_keywords = ", ".join(parsed_project.get("style_keywords", ["modern"]))
        materials = ", ".join(parsed_project.get("materials", ["brick", "render"]))
        finish_level = parsed_project.get("finish_level", "premium")
        summary = parsed_project.get("summary", "Melbourne residential development")

        # Build interior-specific comparison prompt
        comparison_prompt = f"""
        You are an architectural interior consistency expert. Analyze this interior image.

        Image 1 (LEFT): EXTERIOR of a {project_type} building (style reference)
        Image 2 (RIGHT): INTERIOR space ({variation_type}) - this is what you are scoring

        PROJECT CONTEXT:
        - Project type: {project_type}
        - Style keywords: {style_keywords}
        - Exterior materials: {materials}
        - Finish level: {finish_level}
        - Description: {summary}

        IMPORTANT: You are NOT checking if the interior shows the same building shape.
        Interior rooms naturally look different from exteriors. Instead, verify:

        SCORING CRITERIA (0-20 points each, total 100):

        1. INTERIOR_STYLE_CONSISTENCY (0-20):
           - Does the interior style match the exterior architectural language?
           - Modern exterior = modern interior, traditional = traditional, etc.
           - Are design language cues consistent (clean lines, materials, details)?
           Score high if the interior "feels like" it belongs in this building.

        2. MATERIAL_FINISH_QUALITY (0-20):
           - Does the finish level match the project brief ({finish_level})?
           - Are materials appropriate for the stated finish level?
           - Quality consistency: premium exterior shouldn't have budget interior.
           Score high if materials and finishes match the project tier.

        3. LIGHTING_APPROPRIATENESS (0-20):
           - Is the lighting quality photorealistic?
           - Does it match Melbourne residential standards?
           - Is natural light handled realistically?
           Score high if lighting looks professional and realistic.

        4. SPATIAL_QUALITY (0-20):
           - Do room proportions feel appropriate for the project type?
           - Is the space representative of this development type?
           - Does ceiling height/room size match expectations?
           Score high if the space feels appropriate for the project.

        5. PROJECT_CONTEXT_MATCH (0-20):
           - Does this interior "belong" to this building?
           - Is there a cohesive design story between exterior and interior?
           - Is it appropriate for the suburb/market level?
           Score high if interior complements the exterior vision.

        RESPOND IN VALID JSON FORMAT ONLY:
        {{
            "total_score": <sum of all scores 0-100>,
            "breakdown": {{
                "interior_style_consistency": <0-20>,
                "material_finish_quality": <0-20>,
                "lighting_appropriateness": <0-20>,
                "spatial_quality": <0-20>,
                "project_context_match": <0-20>
            }},
            "issues": [
                "List each specific issue found",
                "Be specific: 'interior feels too budget for premium project'"
            ],
            "suggestions": [
                "Specific suggestions to improve consistency",
                "E.g., 'Use more premium finishes to match exterior quality'"
            ]
        }}

        Remember: Interior shots naturally look different from exteriors. Focus on
        STYLE CONSISTENCY and QUALITY MATCH, not building shape or facade elements.
        """

        # Create the model
        model = genai.GenerativeModel(VISION_MODEL)

        # Generate comparison analysis
        response = model.generate_content(
            contents=[comparison_prompt, hero_image, generated_image],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
        )

        # Parse the JSON response
        result_text = response.text.strip()

        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]

        result = json.loads(result_text.strip())

        # Determine pass/fail
        total_score = result.get("total_score", 0)
        passed = total_score > VERIFICATION_THRESHOLD

        # Build fixing prompt if needed
        fixing_prompt = None
        if not passed:
            fixing_lines = []
            breakdown = result.get("breakdown", {})

            for criterion, score in breakdown.items():
                if score < 16:
                    related_issues = [
                        issue for issue in result.get("issues", [])
                        if criterion.replace("_", " ").lower() in issue.lower()
                    ]
                    fixing_lines.append(
                        f"FIX {criterion}: scored {score}/20 - {related_issues[0] if related_issues else 'improve this aspect'}"
                    )

            for suggestion in result.get("suggestions", []):
                fixing_lines.append(f"SUGGESTION: {suggestion}")

            fixing_prompt = "\n".join(fixing_lines)

        return {
            "success": True,
            "total_score": total_score,
            "breakdown": result.get("breakdown", {}),
            "pass": passed,
            "threshold": VERIFICATION_THRESHOLD,
            "issues": result.get("issues", []),
            "suggestions": result.get("suggestions", []),
            "fixing_prompt": fixing_prompt,
            "verification_type": "interior"
        }

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse verification response: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Interior verification error: {str(e)}"
        }


def is_interior_shot(variation_type: str) -> bool:
    """Check if a variation type is an interior shot."""
    return variation_type in INTERIOR_SHOT_IDS


# Tool definition for Claude Agent SDK
verify_consistency.__tool_definition__ = {
    "name": "verify_consistency",
    "description": """Verify architectural consistency between a generated image and the hero reference.

    This tool compares two images and scores the generated image across 5 criteria:
    - Building Shape (0-20)
    - Architectural Style (0-20)
    - Materials/Facade (0-20)
    - Windows/Openings (0-20)
    - Proportions (0-20)

    Returns a total score (0-100), pass/fail status, and fixing instructions if failed.
    Use this after generating each image variation to ensure quality.
    """,
    "input_schema": {
        "type": "object",
        "properties": {
            "hero_image_path": {
                "type": "string",
                "description": "Full path to the original hero/reference image"
            },
            "generated_image_path": {
                "type": "string",
                "description": "Full path to the generated variation image"
            },
            "variation_type": {
                "type": "string",
                "description": "Type of variation for context in comparison"
            }
        },
        "required": ["hero_image_path", "generated_image_path", "variation_type"]
    }
}
