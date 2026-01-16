"""
Prompts package for SQM Project Images Generator.

Contains all prompt templates, suburb data, and shot type definitions
for generating photorealistic architectural images.
"""

from .melbourne_suburbs import (
    MELBOURNE_SUBURBS,
    get_suburb_context,
    build_suburb_context_prompt
)

from .shot_types import (
    SHOT_TYPES,
    SHOT_CATEGORIES,
    MULTI_UNIT_EXTRA_SHOTS,
    get_shot_by_id,
    get_shots_by_category,
    get_hero_shot,
    get_all_shots_ordered,
    get_category_info,
    get_shots_for_project_type
)

from .photorealistic import (
    PHOTOREALISTIC_BASE,
    PROJECT_TYPE_PROMPTS,
    LIGHTING_CONDITIONS,
    build_photorealistic_prompt,
    get_lighting_for_shot
)

from .style_transfer import (
    build_style_analysis_prompt,
    build_style_transfer_hero_prompt,
    build_regeneration_prompt_with_feedback
)

__all__ = [
    # Melbourne suburbs
    "MELBOURNE_SUBURBS",
    "get_suburb_context",
    "build_suburb_context_prompt",
    # Shot types
    "SHOT_TYPES",
    "SHOT_CATEGORIES",
    "MULTI_UNIT_EXTRA_SHOTS",
    "get_shot_by_id",
    "get_shots_by_category",
    "get_hero_shot",
    "get_all_shots_ordered",
    "get_category_info",
    "get_shots_for_project_type",
    # Photorealistic
    "PHOTOREALISTIC_BASE",
    "PROJECT_TYPE_PROMPTS",
    "LIGHTING_CONDITIONS",
    "build_photorealistic_prompt",
    "get_lighting_for_shot",
    # Style transfer
    "build_style_analysis_prompt",
    "build_style_transfer_hero_prompt",
    "build_regeneration_prompt_with_feedback",
]
