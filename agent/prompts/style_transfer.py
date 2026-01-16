"""
Style Transfer Prompts for Inspiration-Based Hero Generation

Defines prompts for:
1. Analyzing an inspiration image to extract style elements
2. Generating a new building design that captures that style
"""

from typing import Dict, Any


def build_style_analysis_prompt() -> str:
    """
    Build the prompt for analyzing an inspiration image to extract style elements.
    This analysis is used to guide the generation of a new building in a similar style.
    """
    return """<task>
Analyze this architectural photograph as a style reference for generating a new building design.
You are extracting the visual DNA of this design to inspire a NEW building, not to copy it.
</task>

<extraction_requirements>

<architectural_style>
- Primary style classification (Modern, Contemporary, Heritage, Art Deco, Mid-Century, Brutalist, Minimalist, etc.)
- Era influence if apparent (1950s mid-century, 2020s contemporary, etc.)
- Regional influence if visible (Melbourne, Mediterranean, Japanese, Scandinavian, etc.)
- Design philosophy (clean lines, organic forms, geometric patterns, etc.)
</architectural_style>

<materials_palette>
Extract specific material details that define the aesthetic:

BRICK (if present):
- Colour: specific shade (charcoal, cream, red oxide, etc.)
- Bond pattern: stretcher, stack, flemish, etc.
- Finish: smooth, textured, glazed
- Proportion of facade: approximate percentage

RENDER (if present):
- Colour: specific shade with undertones
- Finish: smooth, bagged, textured
- Proportion of facade

TIMBER (if present):
- Apparent species/colour (spotted gum, blackbutt, etc.)
- Orientation: horizontal battens, vertical screens, panels
- Finish: natural, stained, painted

METAL (if present):
- Type: aluminium, steel, corten, zinc
- Colour: black, white, natural, coloured
- Application: framing, screens, cladding

GLASS (if present):
- Extent: minimal, moderate, extensive glazing
- Frame colour: black, white, timber-look
- Type: clear, tinted, frosted

Material proportions summary (e.g., "60% dark brick, 25% white render, 15% timber battens")
</materials_palette>

<design_elements>
Key architectural features that define the character:
- Roof form: flat, pitched, skillion, butterfly, parapet
- Roof materials and colour
- Cantilevers or projecting elements
- Screens or privacy elements (timber, metal, perforated)
- Voids or recesses
- Balconies: type and materials
- Entry treatment: canopy, portico, recessed
- Window patterns: regular, irregular, feature
- Garage door style and integration
</design_elements>

<colour_scheme>
- Dominant colour(s): specific shades
- Accent colours: where and what
- Warm/cool balance: predominantly warm, cool, or neutral
- Contrast level: high contrast or tonal
- Monochromatic vs multi-tonal
</colour_scheme>

<spatial_qualities>
- Building massing: compact, elongated, L-shaped, articulated
- Proportions: horizontal emphasis, vertical emphasis, balanced
- Solid-to-void ratio: heavy/solid, light/open, balanced
- Setback treatment: landscaped, paved, minimal
- Boundary relationship: close to boundary, generous setbacks
- Scale: intimate, grand, human-scale
</spatial_qualities>

<lighting_mood>
- Time of day captured: morning, midday, afternoon, twilight
- Weather conditions: sunny, overcast, dramatic
- Shadow quality: soft, harsh, dappled
- Overall atmosphere: warm, cool, neutral
</lighting_mood>

<distinctive_features>
List 3-5 memorable design elements that make this building unique:
- What would you remember about this building?
- What makes it photographable?
- What sets it apart from generic developments?
</distinctive_features>

</extraction_requirements>

<output_format>
Return a JSON object with all extracted style elements:
{
    "architectural_style": {
        "primary": "<main style>",
        "era_influence": "<if apparent>",
        "regional_influence": "<if visible>",
        "design_philosophy": "<key characteristics>"
    },
    "materials": {
        "primary_material": "<dominant material with details>",
        "secondary_material": "<second most prominent>",
        "accent_materials": ["<list of accent materials>"],
        "proportions_summary": "<e.g., 60% brick, 30% render, 10% timber>"
    },
    "design_elements": {
        "roof_form": "<description>",
        "key_features": ["<list of notable features>"],
        "window_treatment": "<description>",
        "entry_design": "<description>"
    },
    "colour_scheme": {
        "dominant_colours": ["<list with specific shades>"],
        "accent_colours": ["<if any>"],
        "temperature": "<warm/cool/neutral>",
        "contrast_level": "<high/medium/low>"
    },
    "spatial_qualities": {
        "massing": "<description>",
        "proportions": "<horizontal/vertical/balanced>",
        "solid_void_ratio": "<heavy/balanced/light>",
        "scale_feeling": "<intimate/human-scale/grand>"
    },
    "distinctive_features": ["<list 3-5 memorable elements>"],
    "style_summary": "<One paragraph describing the overall aesthetic in a way that could guide new design generation>"
}
</output_format>"""


def build_style_transfer_hero_prompt(
    style_analysis: Dict[str, Any],
    user_prompt: str,
    parsed: Dict[str, Any],
    suburb_context: str,
    photorealistic_requirements: str
) -> str:
    """
    Build the prompt for generating a new hero image inspired by the analyzed style.

    Args:
        style_analysis: Dictionary from analyze_inspiration_style()
        user_prompt: Optional user text describing what they want
        parsed: Parsed project details (type, suburb, etc.)
        suburb_context: Melbourne suburb context string
        photorealistic_requirements: Standard photorealistic requirements

    Returns:
        XML-structured prompt for Gemini image generation
    """
    # Extract key style elements for the prompt
    arch_style = style_analysis.get("architectural_style", {})
    materials = style_analysis.get("materials", {})
    design_elements = style_analysis.get("design_elements", {})
    colours = style_analysis.get("colour_scheme", {})
    spatial = style_analysis.get("spatial_qualities", {})
    distinctive = style_analysis.get("distinctive_features", [])
    style_summary = style_analysis.get("style_summary", "")

    # Format materials for prompt
    materials_str = f"""
Primary: {materials.get('primary_material', 'quality materials')}
Secondary: {materials.get('secondary_material', 'complementary materials')}
Accents: {', '.join(materials.get('accent_materials', []))}
Proportions: {materials.get('proportions_summary', 'balanced mix')}"""

    # Format design elements
    key_features = design_elements.get('key_features', [])
    features_str = '\n'.join(f"- {f}" for f in key_features) if key_features else "- Quality architectural detailing"

    # Format distinctive elements
    distinctive_str = '\n'.join(f"- {d}" for d in distinctive) if distinctive else "- Memorable design presence"

    # Format colours
    dominant_colours = colours.get('dominant_colours', ['neutral tones'])
    colour_str = f"Dominant: {', '.join(dominant_colours)}, Temperature: {colours.get('temperature', 'neutral')}"

    # Project details
    project_type = parsed.get('project_type', 'dual_occupancy').replace('_', ' ').title()
    num_units = parsed.get('num_units', 2)
    storeys = parsed.get('storeys', 2)
    finish_level = parsed.get('finish_level', 'premium').title()

    prompt = f"""<role>
You are a professional architectural visualization specialist creating a NEW building design
inspired by a reference image's style and aesthetic.

CRITICAL: You are NOT copying the inspiration building. You are creating a COMPLETELY NEW design
that captures the SPIRIT, AESTHETIC, and MATERIAL LANGUAGE of the inspiration.
</role>

<inspiration_analysis>
<style_summary>
{style_summary}
</style_summary>

<architectural_language>
Primary Style: {arch_style.get('primary', 'Contemporary')}
Era Influence: {arch_style.get('era_influence', 'Current')}
Design Philosophy: {arch_style.get('design_philosophy', 'Quality-focused')}
</architectural_language>

<materials_to_apply>
{materials_str}
</materials_to_apply>

<design_elements_to_incorporate>
Roof Form: {design_elements.get('roof_form', 'Contemporary form')}
Key Features:
{features_str}
Window Treatment: {design_elements.get('window_treatment', 'Well-proportioned openings')}
Entry Design: {design_elements.get('entry_design', 'Welcoming threshold')}
</design_elements_to_incorporate>

<colour_palette>
{colour_str}
Contrast: {colours.get('contrast_level', 'Medium')}
</colour_palette>

<spatial_approach>
Massing: {spatial.get('massing', 'Articulated')}
Proportions: {spatial.get('proportions', 'Balanced')}
Solid-Void Ratio: {spatial.get('solid_void_ratio', 'Balanced')}
Scale: {spatial.get('scale_feeling', 'Human-scale')}
</spatial_approach>

<distinctive_elements_to_capture>
{distinctive_str}
</distinctive_elements_to_capture>
</inspiration_analysis>

<project_brief>
<user_description>{user_prompt if user_prompt else f"Create a premium {project_type.lower()} development"}</user_description>
<type>{project_type}</type>
<units>{num_units}</units>
<storeys>{storeys}</storeys>
<finish_level>{finish_level}</finish_level>
</project_brief>

<location>
{suburb_context}
</location>

<critical_instructions>
CREATE A NEW BUILDING THAT:

1. CAPTURES THE AESTHETIC of the inspiration:
   - Use the SAME or SIMILAR material palette
   - Apply the SAME proportional relationships
   - Echo the DESIGN LANGUAGE (how elements are composed)
   - Match the COLOUR TEMPERATURE and contrast level

2. IS COMPLETELY UNIQUE:
   - Different building footprint and form
   - Different window arrangement (but similar style)
   - Different entry composition (but similar quality)
   - Your own interpretation of the distinctive elements

3. FITS THE CONTEXT:
   - Appropriate for {parsed.get('suburb', 'Melbourne').replace('_', ' ').title()} Melbourne
   - Suitable for a {project_type.lower()} ({num_units} units)
   - Reflects {finish_level.lower()} finish level expectations

4. MAINTAINS QUALITY:
   - Professional architectural standard
   - Developer marketing quality
   - Suitable for realestate.com.au listings

DO NOT:
- Copy the exact building shape from the inspiration
- Replicate the same window pattern exactly
- Mirror the exact entry design
- Clone the landscaping or context
</critical_instructions>

<photorealistic_requirements>
{photorealistic_requirements}
</photorealistic_requirements>

<shot_specification>
<type>Primary Facade - Hero Shot</type>
<camera>
- Eye-level perspective from footpath opposite the building
- 35mm lens equivalent, f/11 aperture for maximum sharpness
- Perfectly straight vertical lines - absolutely NO keystoning
- Two-point perspective with building centred in frame
</camera>
<composition>
- Full building visible from ground to roofline
- 20-30% sky visible at top of frame
- Front garden, setback, and driveway included
- Melbourne suburban street context visible
</composition>
<lighting>
- Soft overcast daylight OR morning sun (not harsh midday)
- Even illumination showing materials and textures
- Subtle shadows for depth and definition
</lighting>
</shot_specification>

<output>
Generate a single photorealistic exterior photograph of this NEW building design.
The image should look like professional DSLR photography, not CGI.
</output>"""

    return prompt


def build_regeneration_prompt_with_feedback(
    base_prompt: str,
    user_feedback: str
) -> str:
    """
    Build a regeneration prompt that incorporates user feedback.

    Args:
        base_prompt: The original generation prompt
        user_feedback: User's feedback about what to change

    Returns:
        Updated prompt with feedback incorporated
    """
    feedback_section = f"""
<user_feedback>
The previous generation was not quite right. Please make these adjustments:
{user_feedback}
</user_feedback>

<regeneration_instruction>
Generate a NEW image that addresses the feedback above while maintaining:
- The same inspiration style and material language
- The same project requirements (type, units, suburb)
- Professional photorealistic quality
</regeneration_instruction>
"""

    # Insert feedback before the output section
    if "<output>" in base_prompt:
        parts = base_prompt.rsplit("<output>", 1)
        return parts[0] + feedback_section + "<output>" + parts[1]
    else:
        return base_prompt + feedback_section
