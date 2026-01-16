"""
Shot Types Definitions for Architect's Showcase Package

Defines the 18 standard shots that make up a complete project showcase,
organized into 6 categories following professional architectural photography principles.
"""

from typing import List, Dict, Any

SHOT_CATEGORIES = {
    "hero_shots": {
        "name": "Hero Shots",
        "description": "The money shots - website banners, brochure covers, planning submissions",
        "count": 3
    },
    "site_context": {
        "name": "Site & Context",
        "description": "How the building fits its neighbourhood - critical for planning permits",
        "count": 3
    },
    "architectural_features": {
        "name": "Architectural Features",
        "description": "Design thinking and quality detailing - differentiates from generic developments",
        "count": 3
    },
    "interior_spaces": {
        "name": "Key Interior Spaces",
        "description": "Livability and spatial quality - for buyer marketing and pre-sales",
        "count": 4
    },
    "spatial_experience": {
        "name": "Spatial Experience",
        "description": "Architectural quality beyond floor area - the wow factor",
        "count": 3
    },
    "lifestyle_atmosphere": {
        "name": "Lifestyle & Atmosphere",
        "description": "Emotional connection - help buyers imagine their life in this home",
        "count": 2
    }
}

SHOT_TYPES: List[Dict[str, Any]] = [
    # ============================================
    # HERO SHOTS (3 images)
    # ============================================
    {
        "id": "hero_facade",
        "category": "hero_shots",
        "name": "Primary Facade",
        "order": 1,
        "is_hero": True,
        "prompt": """
SHOT TYPE: Primary Facade (Hero Shot)

CAMERA SETUP:
- Eye-level perspective, standing on footpath opposite the building
- 35mm lens equivalent, f/11 for maximum sharpness
- Perfectly straight vertical lines - NO keystoning/perspective distortion
- Two-point perspective, building centred in frame

LIGHTING:
- Soft overcast OR morning sun (not harsh midday)
- Even illumination across facade
- Subtle shadows showing depth and texture

COMPOSITION:
- Full building visible from ground to roofline
- Include portion of sky (20-30% of frame)
- Show front garden/setback and driveway
- Include street trees or landscaping at edges

REQUIREMENTS:
- This is the PRIMARY hero image that defines the building design
- Must show all key architectural features clearly
- Premium real estate photography quality
- Professional architectural firm presentation standard
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "hero_twilight",
        "category": "hero_shots",
        "name": "Twilight Hero",
        "order": 2,
        "is_hero": True,
        "prompt": """
SHOT TYPE: Twilight Hero Shot

CAMERA SETUP:
- Same angle as primary facade
- 35mm lens equivalent, longer exposure for low light
- Perfectly straight verticals
- Tripod stability look (sharp, no motion blur)

LIGHTING - BLUE HOUR:
- Sky: Deep blue twilight, 20 minutes after sunset
- Interior lights: Warm glow at 30% brightness through windows
- Warm/cool colour contrast between interior and sky
- Subtle uplighting on facade if appropriate

COMPOSITION:
- Same framing as primary facade
- Interior lights creating warm glow
- Evening sky gradation from horizon to top
- Landscape lighting visible if present

MOOD:
- Dramatic but realistic (not overdone)
- Inviting, aspirational
- Showcases how the home looks lived-in at night
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "hero_elevated",
        "category": "hero_shots",
        "name": "Elevated 3/4 Angle",
        "order": 3,
        "is_hero": True,
        "prompt": """
SHOT TYPE: Elevated 3/4 Angle (Drone Perspective)

CAMERA SETUP:
- Drone height approximately 10-15 meters
- 45-degree diagonal angle showing two facades
- 35mm equivalent lens
- Slight downward tilt to show roof form

COMPOSITION:
- Building at 45-degree angle showing front and side
- Roof form and materials clearly visible
- Surrounding landscaping and garden design shown
- Neighbouring properties partially visible for context
- Driveway and car parking arrangement visible

REVEALS:
- Roof design and materials
- Overall building massing and form
- Relationship to site boundaries
- Outdoor living areas and courtyards
- Garden design and landscaping
""",
        "aspect_ratio": "16:9"
    },

    # ============================================
    # SITE & CONTEXT (3 images)
    # ============================================
    {
        "id": "context_street",
        "category": "site_context",
        "name": "Street Scene",
        "order": 4,
        "prompt": """
SHOT TYPE: Street Scene Context

CAMERA SETUP:
- Wide shot from footpath, 24mm lens equivalent
- Building in context with neighbours on either side
- Eye-level, standing back to show streetscape

COMPOSITION:
- Subject building as clear focal point (centre third)
- 1-2 neighbouring properties visible on each side
- Street trees and nature strip included
- Footpath and portion of road visible
- Sky showing (15-20% of frame)

PURPOSE - PLANNING PERMIT JUSTIFICATION:
- Show building is sympathetic to streetscape
- Demonstrate appropriate scale relative to neighbours
- Quality contribution to street character
- Setback alignment with neighbours
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "context_aerial",
        "category": "site_context",
        "name": "Aerial/Drone View",
        "order": 5,
        "prompt": """
SHOT TYPE: Aerial Site View

CAMERA SETUP:
- Drone perspective, 20-30 meters height
- Looking down at approximately 60-degree angle
- Wide enough to show full site boundaries

COMPOSITION:
- Full site boundaries visible
- Roof and building footprint clear
- Front, rear, and side setbacks measurable
- Private open space clearly shown
- Car parking and driveway arrangement
- Neighbouring properties for context

DEMONSTRATES:
- Site coverage percentage
- Setback compliance
- Private open space allocation
- Vehicle access and parking
- Relationship to neighbours
""",
        "aspect_ratio": "4:3"
    },
    {
        "id": "context_approach",
        "category": "site_context",
        "name": "Pedestrian Approach",
        "order": 6,
        "prompt": """
SHOT TYPE: Pedestrian Approach

CAMERA SETUP:
- Walking towards entry, eye-level
- 35mm lens equivalent
- Slightly lower angle looking up at entry

COMPOSITION:
- View as visitor walking up to front door
- Path/driveway leading to entry
- Entry canopy or portico as focal point
- Front garden and landscaping
- House number and letterbox visible

EXPERIENCE CAPTURED:
- Arrival sequence
- Street presence and curb appeal
- Sense of welcome
- Quality of entry design
- Landscaping first impressions
""",
        "aspect_ratio": "4:3"
    },

    # ============================================
    # ARCHITECTURAL FEATURES (3 images)
    # ============================================
    {
        "id": "feature_entry",
        "category": "architectural_features",
        "name": "Entry Threshold",
        "order": 7,
        "prompt": """
SHOT TYPE: Entry Threshold Detail

CAMERA SETUP:
- Close-up of entry door and surrounds
- 50mm lens equivalent for accurate proportions
- Straight-on or slight angle

COMPOSITION:
- Front door as centrepiece
- Entry canopy/portico above
- Lighting fixture(s)
- Door handle and hardware detail
- Step/threshold treatment
- Side panels or glazing if present

DESIGN INTENT:
- The arrival moment
- Transition from public to private
- Material quality at touch points
- Architectural character introduction
""",
        "aspect_ratio": "4:3"
    },
    {
        "id": "feature_material",
        "category": "architectural_features",
        "name": "Material Detail",
        "order": 8,
        "prompt": """
SHOT TYPE: Material Detail Close-up

CAMERA SETUP:
- Extreme close-up, macro-style
- 85mm equivalent for detail work
- Shallow depth of field highlighting texture

COMPOSITION:
- Junction of 2-3 materials meeting
- Brick coursing, timber grain, or render texture
- Approximately 1m x 1m area of facade
- Natural light showing texture and depth

SHOWCASES:
- Craftsmanship in material selection
- Quality of finishes and junctions
- Brick pattern, timber species, render finish
- How materials age and weather
""",
        "aspect_ratio": "1:1"
    },
    {
        "id": "feature_signature",
        "category": "architectural_features",
        "name": "Signature Element",
        "order": 9,
        "prompt": """
SHOT TYPE: Signature Architectural Element

CAMERA SETUP:
- Framed to highlight the key design move
- Lens choice based on element scale
- Dramatic angle if appropriate

COMPOSITION:
- The memorable design feature
- Could be: cantilever, screening, void, feature window
- Isolated to emphasize its importance
- Sky or neutral background

CAPTURES:
- The defining architectural gesture
- What makes this project unique
- The architect's signature move
- Instagram-worthy detail shot
""",
        "aspect_ratio": "4:3"
    },

    # ============================================
    # KEY INTERIOR SPACES (4 images)
    # ============================================
    {
        "id": "interior_living",
        "category": "interior_spaces",
        "name": "Living to Outdoor",
        "order": 10,
        "prompt": """
SHOT TYPE: Living Room to Outdoor Connection

CAMERA SETUP:
- Wide angle 24mm equivalent
- From living room corner looking towards garden
- Doors/windows open to outdoor space

COMPOSITION:
- Open plan living visible
- Large sliding/bifold doors to garden
- Outdoor living area visible through glass
- Natural light flooding the space
- Furniture arrangement showing scale

DEMONSTRATES:
- Indoor-outdoor flow
- Natural light quality
- Spatial generosity
- Connection to garden
- Melbourne lifestyle living
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "interior_kitchen",
        "category": "interior_spaces",
        "name": "Kitchen",
        "order": 11,
        "prompt": """
SHOT TYPE: Kitchen Feature Shot

CAMERA SETUP:
- Wide angle from dining area or living room
- 24-28mm equivalent
- Eye-level, showing benchtop and splashback

COMPOSITION:
- Island bench as focal point
- Joinery quality visible
- Appliance integration
- Pendant lighting above island
- Stone or quality benchtop material
- Splashback detail

BUYER PRIORITIES:
- Island bench size (entertaining capacity)
- Storage and joinery quality
- Appliance space and integration
- Work triangle efficiency
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "interior_master",
        "category": "interior_spaces",
        "name": "Master Suite",
        "order": 12,
        "prompt": """
SHOT TYPE: Master Bedroom Suite

CAMERA SETUP:
- From doorway or corner
- 28mm equivalent
- Showing bed and ensuite glimpse

COMPOSITION:
- King bed with styled bedding
- Window with natural light
- Walk-in robe entrance visible
- Ensuite doorway glimpsed
- Pendant or bedside lighting

CONVEYS:
- Room proportions and size
- Natural light quality
- Sense of retreat and privacy
- Connection to ensuite and WIR
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "interior_bathroom",
        "category": "interior_spaces",
        "name": "Bathroom",
        "order": 13,
        "prompt": """
SHOT TYPE: Feature Bathroom

CAMERA SETUP:
- Wide shot showing full bathroom
- 24mm equivalent
- Highlight freestanding bath or feature shower

COMPOSITION:
- Freestanding bath OR feature shower as hero
- Floor-to-ceiling tiles
- Double vanity with mirror
- Quality fixtures and tapware
- Natural light from window if present

FINISH QUALITY INDICATORS:
- Tile selection and laying pattern
- Fixture quality (matte black, brushed brass, etc)
- Stone or quality vanity top
- Sense of luxury and spa-like retreat
""",
        "aspect_ratio": "4:3"
    },

    # ============================================
    # SPATIAL EXPERIENCE (3 images)
    # ============================================
    {
        "id": "spatial_staircase",
        "category": "spatial_experience",
        "name": "Staircase Void",
        "order": 14,
        "prompt": """
SHOT TYPE: Staircase and Void

CAMERA SETUP:
- Looking up through stairwell void
- Wide angle to capture vertical space
- From ground or mid-landing

COMPOSITION:
- Stair treads and balustrade
- Void space above
- Skylight or high window
- Natural light from above
- Sculptural stair element

ARCHITECTURAL QUALITY:
- Vertical drama
- Light well effect
- Circulation as feature
- Material quality (timber, steel, glass)
""",
        "aspect_ratio": "3:4"
    },
    {
        "id": "spatial_window",
        "category": "spatial_experience",
        "name": "Window Moment",
        "order": 15,
        "prompt": """
SHOT TYPE: Window Moment / Light Quality

CAMERA SETUP:
- Interior shot featuring significant window
- Backlit or side-lit
- 35mm equivalent

COMPOSITION:
- Feature window as focal point
- Light streaming into space
- View framed through window
- Interior furniture silhouetted
- Time of day light quality

CAPTURES:
- How light enters the home
- Framed views to garden or landscape
- Connection to outdoors
- Architectural framing of nature
""",
        "aspect_ratio": "4:3"
    },
    {
        "id": "spatial_volume",
        "category": "spatial_experience",
        "name": "Volume Shot",
        "order": 16,
        "prompt": """
SHOT TYPE: Double Height / Volume Space

CAMERA SETUP:
- Wide angle capturing full height
- 24mm equivalent
- Looking up to show ceiling detail

COMPOSITION:
- Double-height void OR raking ceiling
- Upper windows or clerestory
- Pendant lighting at scale
- Lower and upper levels connected
- If single storey: ceiling detail and height

WOW FACTOR:
- Spatial generosity
- Light from above
- Sense of volume and air
- Premium space feeling
""",
        "aspect_ratio": "3:4"
    },

    # ============================================
    # LIFESTYLE & ATMOSPHERE (2 images)
    # ============================================
    {
        "id": "lifestyle_morning",
        "category": "lifestyle_atmosphere",
        "name": "Morning Light",
        "order": 17,
        "prompt": """
SHOT TYPE: Morning Light Scene

CAMERA SETUP:
- Kitchen or dining area
- Eastern light streaming in
- Warm morning tones

COMPOSITION:
- Breakfast setting (coffee cup, newspaper)
- Morning light through east-facing windows
- Kitchen bench or dining table
- Fresh, optimistic atmosphere
- Signs of life but no people visible

EMOTIONAL APPEAL:
- Fresh start feeling
- Optimism and possibility
- Eastern orientation benefits
- Daily ritual moments
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "lifestyle_evening",
        "category": "lifestyle_atmosphere",
        "name": "Evening Entertaining",
        "order": 18,
        "prompt": """
SHOT TYPE: Evening Entertaining / Alfresco

CAMERA SETUP:
- Outdoor living area
- Twilight or early evening
- Warm interior light spilling out

COMPOSITION:
- Alfresco dining area
- Outdoor kitchen or BBQ area
- Garden and landscaping
- String lights or outdoor lighting
- Set table suggesting entertaining
- Interior visible through glass doors

MELBOURNE LIFESTYLE:
- Outdoor entertaining culture
- Garden as extension of living
- Evening gatherings
- Aspirational social life
""",
        "aspect_ratio": "16:9"
    }
]


def get_shot_by_id(shot_id: str) -> Dict[str, Any] | None:
    """Get a specific shot definition by ID."""
    for shot in SHOT_TYPES:
        if shot["id"] == shot_id:
            return shot
    return None


def get_shots_by_category(category: str) -> List[Dict[str, Any]]:
    """Get all shots in a specific category."""
    return [shot for shot in SHOT_TYPES if shot["category"] == category]


def get_hero_shot() -> Dict[str, Any]:
    """Get the primary hero shot (used to establish the design)."""
    for shot in SHOT_TYPES:
        if shot.get("is_hero") and shot["order"] == 1:
            return shot
    return SHOT_TYPES[0]


def get_all_shots_ordered() -> List[Dict[str, Any]]:
    """Get all shots in generation order."""
    return sorted(SHOT_TYPES, key=lambda x: x["order"])


def get_category_info(category: str) -> Dict[str, Any] | None:
    """Get category metadata."""
    return SHOT_CATEGORIES.get(category)


# ============================================
# MULTI-UNIT EXTRA SHOTS (2 additional images)
# For townhouses (3+ units) and apartments
# ============================================
MULTI_UNIT_EXTRA_SHOTS: List[Dict[str, Any]] = [
    {
        "id": "multi_unit_variety",
        "category": "architectural_features",
        "name": "Unit Variety",
        "order": 19,
        "prompt": """
SHOT TYPE: Unit Variety / Facade Differentiation

CAMERA SETUP:
- Wide shot showing 2-4 different unit facades
- 28mm equivalent
- Eye-level from street or internal driveway
- Angle to show multiple unit fronts

COMPOSITION:
- Multiple unit entries visible
- Show facade treatment variations between units
- Individual entries/addresses clear
- Consistent overall design language
- Different but cohesive

DEMONSTRATES:
- How units differ while maintaining design unity
- Individual identity within the development
- Street presence of multiple entries
- Quality repeated across all units
- Townhouse streetscape contribution
""",
        "aspect_ratio": "16:9"
    },
    {
        "id": "multi_shared_spaces",
        "category": "lifestyle_atmosphere",
        "name": "Shared Spaces",
        "order": 20,
        "prompt": """
SHOT TYPE: Shared Spaces / Common Areas

CAMERA SETUP:
- Wide angle of communal area
- 24mm equivalent
- Eye-level or slightly elevated

COMPOSITION:
- Common garden, courtyard, or driveway
- Landscaping between units
- Shared amenities (if any)
- How private entries relate to common space
- Quality of shared landscape design

FOR TOWNHOUSES:
- Common driveway and landscaping
- How units relate to each other
- Private outdoor spaces vs shared areas

FOR APARTMENTS:
- Lobby or entry foyer
- Common garden or rooftop
- Shared circulation spaces
- Landscape design in common areas

DEMONSTRATES:
- Community design thinking
- Quality of common areas
- Balance of private and shared
- Body corporate presentation
""",
        "aspect_ratio": "16:9"
    }
]


def get_shots_for_project_type(project_type: str, num_units: int = 2) -> List[Dict[str, Any]]:
    """
    Get the appropriate shot list based on project type and unit count.

    Multi-unit projects (townhouses with 3+ units, apartments) get 2 extra shots:
    - Unit Variety: Shows facade differentiation across units
    - Shared Spaces: Shows common areas and how units relate

    Args:
        project_type: 'dual_occupancy', 'townhouses', or 'apartments'
        num_units: Number of units (for townhouses)

    Returns:
        List of shots in order, including extras for multi-unit projects
    """
    base_shots = get_all_shots_ordered()

    # Add extra shots for multi-unit projects
    if project_type == "apartments" or (project_type == "townhouses" and num_units >= 3):
        return base_shots + sorted(MULTI_UNIT_EXTRA_SHOTS, key=lambda x: x["order"])

    return base_shots
