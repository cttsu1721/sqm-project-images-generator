"""
Photorealistic Prompt Requirements

Defines the strict requirements for generating photorealistic architectural images
that match professional real estate photography standards (realestate.com.au quality).
"""

# Base photorealistic requirements applied to ALL generated images
PHOTOREALISTIC_BASE = """
PHOTOREALISTIC MANDATORY REQUIREMENTS:

CAMERA SIMULATION:
- Professional DSLR quality (Canon 5D Mark IV / Sony A7R IV style output)
- Natural sensor characteristics with subtle noise in shadows
- Appropriate lens for shot type (wide angle 24mm for interiors, 35-50mm for exteriors)
- Natural depth of field appropriate to aperture (f/8-f/11 for architecture)
- Subtle natural vignette at extreme edges
- NO artificial bokeh or tilt-shift miniature effects

PERSPECTIVE & GEOMETRY:
- Vertical lines MUST be perfectly straight (no keystoning)
- Two-point perspective for exterior shots
- Horizon line level
- Natural wide-angle barrel distortion only at extreme edges
- Tilt-shift correction applied for tall buildings

LIGHTING REALITY:
- Real Australian light quality (harsh Melbourne sun OR soft overcast)
- Accurate shadow direction matching sun position
- Shadow softness appropriate to sky conditions
- Interior shots: realistic window light falloff (inverse square law)
- NO "CGI glow" or unrealistic ambient occlusion
- NO flat, even "rendered" lighting

SURFACE & MATERIAL REALISM:
- Material imperfections (brick colour variation, timber grain variation)
- Realistic reflections on glass (showing sky, trees, not blank)
- Polished surfaces show environment reflections
- Matte surfaces show subtle texture
- Weather-appropriate appearance (new build = pristine but not perfect)
- NO "plastic", "waxy", or "CGI" material look
- Subtle dust on outdoor surfaces, fingerprints on glass doors

ENVIRONMENTAL TRUTH:
- Melbourne-specific vegetation (eucalypts, native grasses, OR established exotic gardens)
- Australian sky quality (not generic blue dome - real cloud formations)
- Realistic street furniture (Australian letterboxes, bins, fences)
- Correct season indicators (deciduous trees bare in winter, green in summer)
- Real grass texture (not CGI grass)

HUMAN TRACES (but no visible people):
- Subtle signs of habitation in lifestyle shots
- Furniture that looks "placed" not "rendered"
- Real fabric textures on cushions and throws
- Styled but lived-in feel (coffee cup, book, throw blanket)
- NO people visible in any shots

TECHNICAL PHOTOGRAPHY:
- Clean sensor (no dust spots)
- Proper white balance for conditions
- Natural colour grading (not over-saturated)
- Subtle HDR blending look for high contrast scenes (realistic, not overdone)
- Sharp focus throughout architectural elements
"""

# Project type specific additions
PROJECT_TYPE_PROMPTS = {
    "dual_occupancy": """
PROJECT TYPE: Dual Occupancy Development

SPECIFIC REQUIREMENTS:
- Two distinct but complementary dwellings visible
- Show how units relate to each other (side-by-side OR front-back)
- Shared driveway arrangement clearly shown
- Individual entries distinguished
- Privacy between units demonstrated
- Melbourne council setback requirements reflected

DESIGN LANGUAGE:
- Units should share common design language
- Material palette consistent between units
- Can have subtle variations (mirror image, colour variations)
- Professional developer quality, not project home look
""",

    "townhouses": """
PROJECT TYPE: Townhouse Development (3-6 units)

SPECIFIC REQUIREMENTS:
- Multiple attached/semi-attached dwellings
- 2-3 storey construction typical
- Private courtyards for each unit
- Car parking (garage or carport per unit)
- Common driveway and visitor parking
- Body corporate ready design aesthetic

DESIGN LANGUAGE:
- Cohesive development appearance
- Variation in unit types (2, 3, 4 bedroom options)
- Quality finishes appropriate to market
- Landscaping in common areas
- Street presence as unified development
""",

    "apartments": """
PROJECT TYPE: Boutique Apartment Development (3-4 storeys)

SPECIFIC REQUIREMENTS:
- 6-20 units in a single building
- Mix of apartment sizes (1, 2, 3 bedrooms)
- Central lobby and circulation
- Basement or undercroft parking
- Possible ground floor retail (mixed-use)
- Balconies for each unit

DESIGN LANGUAGE:
- Contemporary urban architecture
- Quality facade materials
- Articulated massing to reduce bulk
- Private and common outdoor spaces
- Entry lobby as architectural feature
"""
}

# Lighting condition prompts
LIGHTING_CONDITIONS = {
    "daylight_soft": """
LIGHTING CONDITION: Soft Daylight

- Overcast sky providing even, diffused light
- No harsh shadows
- Colours accurate without strong colour cast
- Ideal for showing building details and materials
- Sky: Light grey to white, soft cloud cover
""",

    "daylight_sunny": """
LIGHTING CONDITION: Sunny Day

- Clear blue sky with defined clouds
- Strong directional sunlight creating shadows
- Building oriented to show sunlit facade
- Shadows showing depth and texture
- Time: Mid-morning or mid-afternoon (not harsh midday)
""",

    "golden_hour": """
LIGHTING CONDITION: Golden Hour

- Warm, golden light (sunrise or sunset)
- Long shadows creating drama
- Warm colour temperature on building
- Sky: Orange/pink gradients near horizon
- Time: 30-60 minutes before sunset
""",

    "blue_hour": """
LIGHTING CONDITION: Blue Hour / Twilight

- Deep blue sky, approximately 20 minutes after sunset
- Interior lights visible through windows (warm glow)
- Warm/cool colour contrast (warm inside, cool outside)
- Stars not yet visible
- Landscape lighting visible
""",

    "interior_daylight": """
LIGHTING CONDITION: Interior with Natural Daylight

- Natural light from windows as primary source
- Realistic falloff from windows into room
- Secondary fill from reflected surfaces
- No harsh artificial lighting
- Time: Midday for even interior light
""",

    "interior_styled": """
LIGHTING CONDITION: Interior Styled/Editorial

- Combination of natural and ambient artificial light
- Pendant lights and lamps providing warm accents
- Window light balanced with interior
- Magazine/editorial quality lighting
- Highlights and shadows for depth
"""
}


def build_photorealistic_prompt(
    project_type: str = "dual_occupancy",
    lighting: str = "daylight_soft"
) -> str:
    """
    Build the complete photorealistic requirements prompt.

    Args:
        project_type: One of 'dual_occupancy', 'townhouses', 'apartments'
        lighting: One of the LIGHTING_CONDITIONS keys

    Returns:
        Complete prompt string with all photorealistic requirements
    """
    parts = [PHOTOREALISTIC_BASE]

    if project_type in PROJECT_TYPE_PROMPTS:
        parts.append(PROJECT_TYPE_PROMPTS[project_type])

    if lighting in LIGHTING_CONDITIONS:
        parts.append(LIGHTING_CONDITIONS[lighting])

    return "\n".join(parts)


def get_lighting_for_shot(shot_id: str) -> str:
    """
    Get appropriate lighting condition for a specific shot type.
    """
    lighting_mapping = {
        # Hero shots
        "hero_facade": "daylight_soft",
        "hero_twilight": "blue_hour",
        "hero_elevated": "daylight_sunny",

        # Site context
        "context_street": "daylight_soft",
        "context_aerial": "daylight_sunny",
        "context_approach": "daylight_soft",

        # Architectural features
        "feature_entry": "daylight_soft",
        "feature_material": "daylight_sunny",  # Sunlight shows texture
        "feature_signature": "golden_hour",  # Dramatic

        # Interior spaces
        "interior_living": "interior_daylight",
        "interior_kitchen": "interior_styled",
        "interior_master": "interior_daylight",
        "interior_bathroom": "interior_styled",

        # Spatial experience
        "spatial_staircase": "interior_daylight",
        "spatial_window": "daylight_sunny",  # Light streaming
        "spatial_volume": "interior_daylight",

        # Lifestyle
        "lifestyle_morning": "golden_hour",  # Morning version
        "lifestyle_evening": "blue_hour"
    }

    return lighting_mapping.get(shot_id, "daylight_soft")
