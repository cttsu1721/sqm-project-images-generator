"""
Storage Tool

Custom tools for Claude Agent SDK that handle image storage
and job status updates.
"""

import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

# Status file location
STATUS_DIR = Path(os.getenv("OUTPUT_DIR", "./generated-images"))


async def store_image(
    job_id: str,
    source_path: str,
    variation_type: str,
    consistency_score: int,
    attempts: int,
    low_confidence: bool = False,
    score_breakdown: Optional[Dict[str, int]] = None
) -> dict:
    """
    Store a generated image and update the job manifest.

    Args:
        job_id: Unique job identifier
        source_path: Path to the generated image file
        variation_type: Type of variation (e.g., aerial_view)
        consistency_score: Final consistency score (0-100)
        attempts: Number of generation attempts
        low_confidence: Whether this image failed verification threshold
        score_breakdown: Optional detailed score breakdown

    Returns:
        dict with success status and stored path
    """
    try:
        # Create job output directory
        output_dir = STATUS_DIR / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        # Generate final filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{variation_type}_{timestamp}.png"
        dest_path = output_dir / filename

        # Copy/move the file
        if os.path.exists(source_path):
            shutil.copy2(source_path, dest_path)
        else:
            return {
                "success": False,
                "error": f"Source image not found: {source_path}"
            }

        # Update manifest
        manifest_path = output_dir / "manifest.json"
        manifest = {"images": [], "job_id": job_id, "created_at": None}

        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
        else:
            manifest["created_at"] = datetime.now().isoformat()

        # Add image to manifest
        image_entry = {
            "id": f"{job_id}_{len(manifest['images']) + 1}",
            "filename": filename,
            "url": f"/api/images/{job_id}/{filename}",
            "variationType": variation_type,
            "consistencyScore": consistency_score,
            "attempts": attempts,
            "lowConfidence": low_confidence,
            "scoreBreakdown": score_breakdown,
            "created_at": datetime.now().isoformat()
        }
        manifest["images"].append(image_entry)
        manifest["updated_at"] = datetime.now().isoformat()

        # Save manifest
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        return {
            "success": True,
            "stored_path": str(dest_path),
            "url": image_entry["url"],
            "image_id": image_entry["id"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Storage error: {str(e)}"
        }


async def update_job_status(
    job_id: str,
    status_data: Dict[str, Any]
) -> dict:
    """
    Update the status file for a generation job.

    Args:
        job_id: Unique job identifier
        status_data: Status information to save

    Returns:
        dict with success status
    """
    try:
        # Create status directory
        status_dir = STATUS_DIR / job_id
        status_dir.mkdir(parents=True, exist_ok=True)

        status_path = status_dir / "status.json"

        # Load existing status if present
        existing_status = {}
        if status_path.exists():
            with open(status_path, "r") as f:
                existing_status = json.load(f)

        # Merge with new data
        existing_status.update(status_data)
        existing_status["updated_at"] = datetime.now().isoformat()

        # Load images from manifest if available
        manifest_path = status_dir / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
                existing_status["images"] = manifest.get("images", [])

        # Save status
        with open(status_path, "w") as f:
            json.dump(existing_status, f, indent=2)

        return {
            "success": True,
            "status_path": str(status_path)
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Status update error: {str(e)}"
        }


# Tool definitions for Claude Agent SDK
store_image.__tool_definition__ = {
    "name": "store_image",
    "description": """Store a generated image and add it to the job manifest.

    Use this after an image has been verified and accepted (score > 80%).
    Also use for low-confidence images that failed after max attempts.

    The image will be copied to the job output directory and added to the manifest.
    """,
    "input_schema": {
        "type": "object",
        "properties": {
            "job_id": {
                "type": "string",
                "description": "Unique job identifier"
            },
            "source_path": {
                "type": "string",
                "description": "Path to the generated image file"
            },
            "variation_type": {
                "type": "string",
                "description": "Type of variation (e.g., aerial_view, night_scene)"
            },
            "consistency_score": {
                "type": "integer",
                "description": "Final consistency score from verification (0-100)"
            },
            "attempts": {
                "type": "integer",
                "description": "Number of generation/regeneration attempts"
            },
            "low_confidence": {
                "type": "boolean",
                "description": "Whether this image failed to meet threshold after max attempts",
                "default": False
            },
            "score_breakdown": {
                "type": "object",
                "description": "Optional detailed score breakdown from verification",
                "properties": {
                    "building_shape": {"type": "integer"},
                    "architectural_style": {"type": "integer"},
                    "materials_facade": {"type": "integer"},
                    "windows_openings": {"type": "integer"},
                    "proportions": {"type": "integer"}
                }
            }
        },
        "required": ["job_id", "source_path", "variation_type", "consistency_score", "attempts"]
    }
}

update_job_status.__tool_definition__ = {
    "name": "update_job_status",
    "description": """Update the status file for a generation job.

    Use this to report progress during generation:
    - status: analyzing, generating, verifying, complete, error
    - progress: 0-100 percentage
    - currentImage: current image number being processed
    - totalImages: total images to generate
    - currentVariation: name of current variation type
    - message: human-readable status message

    The frontend polls this status file to show progress.
    """,
    "input_schema": {
        "type": "object",
        "properties": {
            "job_id": {
                "type": "string",
                "description": "Unique job identifier"
            },
            "status_data": {
                "type": "object",
                "description": "Status information to update",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["analyzing", "generating", "verifying", "complete", "error"]
                    },
                    "progress": {
                        "type": "integer",
                        "description": "Progress percentage 0-100"
                    },
                    "currentImage": {
                        "type": "integer",
                        "description": "Current image number"
                    },
                    "totalImages": {
                        "type": "integer",
                        "description": "Total images to generate"
                    },
                    "currentVariation": {
                        "type": "string",
                        "description": "Current variation type being generated"
                    },
                    "message": {
                        "type": "string",
                        "description": "Human-readable status message"
                    }
                }
            }
        },
        "required": ["job_id", "status_data"]
    }
}
