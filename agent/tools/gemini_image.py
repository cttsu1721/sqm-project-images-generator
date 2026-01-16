"""
Gemini Image Generation Tool

Custom tool for Claude Agent SDK that generates architectural images
using Google Gemini 3 Pro.
"""

import os
import base64
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

import google.generativeai as genai
from PIL import Image

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# Gemini model for image generation
MODEL_NAME = "gemini-3-pro-image-preview"


async def gemini_generate_image(
    hero_image_path: str,
    variation_type: str,
    prompt: str,
    aspect_ratio: str = "16:9",
    image_size: str = "2K",
    fixing_instructions: Optional[str] = None
) -> dict:
    """
    Generate an architectural image variation using Gemini 3 Pro.

    Args:
        hero_image_path: Path to the reference hero image
        variation_type: Type of variation (e.g., aerial_view, night_scene)
        prompt: Detailed description of what to generate
        aspect_ratio: Output aspect ratio (default: 16:9)
        image_size: Output size - 1K, 2K, or 4K (default: 2K)
        fixing_instructions: Optional fixing instructions from failed verification

    Returns:
        dict with:
            - success: bool
            - image_path: Path to generated image (if successful)
            - error: Error message (if failed)
    """
    try:
        # Load the hero image
        if not os.path.exists(hero_image_path):
            return {
                "success": False,
                "error": f"Hero image not found: {hero_image_path}"
            }

        hero_image = Image.open(hero_image_path)

        # Build the generation prompt
        full_prompt = f"""
        Generate an architectural visualization based on this reference building.

        VARIATION TYPE: {variation_type}

        INSTRUCTIONS:
        {prompt}

        REQUIREMENTS:
        - The generated image must show the SAME building as the reference
        - Maintain architectural consistency: shape, style, materials, windows, proportions
        - This is for a professional architecture firm (SQM Architects)
        - High quality, photorealistic rendering
        """

        # Add fixing instructions if provided (for regeneration)
        if fixing_instructions:
            full_prompt += f"""

        FIXING INSTRUCTIONS (from previous verification failure):
        {fixing_instructions}

        Pay special attention to the issues mentioned above.
        """

        # Create the model
        model = genai.GenerativeModel(MODEL_NAME)

        # Generate the image
        response = model.generate_content(
            contents=[full_prompt, hero_image],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="image/png",
            ),
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
            }
        )

        # Extract the image from response
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    # Decode the image
                    image_data = base64.b64decode(part.inline_data.data)

                    # Generate output path
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    output_filename = f"{variation_type}_{timestamp}.png"
                    output_dir = Path(hero_image_path).parent.parent / "generated-images"
                    output_dir.mkdir(parents=True, exist_ok=True)
                    output_path = output_dir / output_filename

                    # Save the image
                    with open(output_path, "wb") as f:
                        f.write(image_data)

                    return {
                        "success": True,
                        "image_path": str(output_path),
                        "variation_type": variation_type,
                        "aspect_ratio": aspect_ratio
                    }

        return {
            "success": False,
            "error": "No image generated in response"
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Gemini API error: {str(e)}"
        }


# Tool definition for Claude Agent SDK
gemini_generate_image.__tool_definition__ = {
    "name": "gemini_generate_image",
    "description": """Generate an architectural image variation using Google Gemini 3 Pro.

    This tool takes a hero reference image and generates a new image from a different
    angle, lighting condition, or environment while maintaining architectural consistency.

    Use this tool when you need to create variations of an architectural project image.
    """,
    "input_schema": {
        "type": "object",
        "properties": {
            "hero_image_path": {
                "type": "string",
                "description": "Full path to the hero/reference image"
            },
            "variation_type": {
                "type": "string",
                "description": "Type of variation: aerial_view, street_level, corner_view, detail_closeup, golden_hour, night_scene, overcast, with_landscaping, with_people"
            },
            "prompt": {
                "type": "string",
                "description": "Detailed description of what to generate, including specific architectural features to preserve"
            },
            "aspect_ratio": {
                "type": "string",
                "description": "Output aspect ratio: 1:1, 4:3, 3:4, 16:9, 9:16",
                "default": "16:9"
            },
            "image_size": {
                "type": "string",
                "description": "Output resolution: 1K, 2K, or 4K",
                "default": "2K"
            },
            "fixing_instructions": {
                "type": "string",
                "description": "Optional: fixing instructions from a failed verification to guide regeneration"
            }
        },
        "required": ["hero_image_path", "variation_type", "prompt"]
    }
}
