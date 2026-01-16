"""
Melbourne Suburbs Context Database

Provides suburb-specific visual context for generating photorealistic
architectural images that look appropriate for each Melbourne location.
"""

MELBOURNE_SUBURBS = {
    # Eastern Suburbs (SQM's Primary Market)
    "balwyn": {
        "style": "premium established",
        "trees": "mature elms, oaks, plane trees",
        "streets": "wide tree-lined avenues",
        "neighbours": "period homes, quality modern infill",
        "finish_level": "high-end",
        "typical_lots": "600-900sqm",
        "character": "Prestigious family area with heritage character and leafy streetscapes"
    },
    "balwyn_north": {
        "style": "family premium",
        "trees": "mixed deciduous, silver birch, ornamental pear",
        "streets": "quieter residential streets",
        "neighbours": "1960s brick, modern rebuilds",
        "finish_level": "high-end",
        "typical_lots": "600-800sqm",
        "character": "Family-oriented with quality schools, mix of period and contemporary homes"
    },
    "camberwell": {
        "style": "heritage premium",
        "trees": "mature elms, established gardens",
        "streets": "heritage overlay areas, wide streets",
        "neighbours": "Victorian, Edwardian, Federation homes",
        "finish_level": "premium",
        "typical_lots": "700-1000sqm",
        "character": "Highly sought-after with heritage character, prestigious schools nearby"
    },
    "canterbury": {
        "style": "exclusive heritage",
        "trees": "mature exotic trees, manicured gardens",
        "streets": "wide, quiet, leafy",
        "neighbours": "grand period homes, architect-designed modern",
        "finish_level": "premium",
        "typical_lots": "800-1500sqm",
        "character": "Melbourne's most prestigious residential area, significant gardens"
    },
    "doncaster": {
        "style": "contemporary diverse",
        "trees": "native and exotic mix",
        "streets": "sloping terrain common",
        "neighbours": "mixed ages, many rebuilds, townhouse developments",
        "finish_level": "mid to high",
        "typical_lots": "500-700sqm",
        "character": "Multicultural, hilly terrain, strong development activity"
    },
    "doncaster_east": {
        "style": "family suburban",
        "trees": "natives, eucalypts, ornamental",
        "streets": "curving streets, cul-de-sacs",
        "neighbours": "1970s-80s brick, some rebuilds",
        "finish_level": "mid-range",
        "typical_lots": "600-800sqm",
        "character": "Established family area, good schools, quieter than Doncaster"
    },
    "box_hill": {
        "style": "urban multicultural",
        "trees": "street trees, less established",
        "streets": "higher density closer to station",
        "neighbours": "apartments, townhouses common",
        "finish_level": "mid-range",
        "typical_lots": "400-600sqm",
        "character": "Urban hub with transport, shopping, Asian cultural influence"
    },
    "box_hill_north": {
        "style": "suburban family",
        "trees": "mix of natives and exotics",
        "streets": "quieter residential",
        "neighbours": "1970s brick, modern townhouses",
        "finish_level": "mid-range",
        "typical_lots": "500-700sqm",
        "character": "Family area, more suburban feel than Box Hill"
    },
    "templestowe": {
        "style": "leafy bush feel",
        "trees": "native eucalypts, established gardens",
        "streets": "winding, larger lots",
        "neighbours": "larger homes, bush blocks",
        "finish_level": "high-end",
        "typical_lots": "800-1200sqm",
        "character": "Bushland feel, larger properties, privacy-focused"
    },
    "templestowe_lower": {
        "style": "suburban family",
        "trees": "native and exotic mix",
        "streets": "suburban streets, some hills",
        "neighbours": "mixed periods, family homes",
        "finish_level": "mid to high",
        "typical_lots": "600-900sqm",
        "character": "Family-focused, river corridor nearby, quieter suburban feel"
    },
    "kew": {
        "style": "heritage premium",
        "trees": "mature deciduous, established gardens",
        "streets": "tree-lined, heritage overlays",
        "neighbours": "Victorian, Edwardian, quality contemporary",
        "finish_level": "premium",
        "typical_lots": "600-1000sqm",
        "character": "Inner-east prestige, heritage charm, excellent schools"
    },
    "kew_east": {
        "style": "established family",
        "trees": "mature trees, well-maintained gardens",
        "streets": "quiet residential",
        "neighbours": "period homes, modern infill",
        "finish_level": "high-end",
        "typical_lots": "600-800sqm",
        "character": "Quieter family area, close to parks and golf courses"
    },

    # South Eastern Suburbs
    "glen_waverley": {
        "style": "modern multicultural",
        "trees": "japanese maples, ornamental cherry, magnolia",
        "streets": "flat suburban grid",
        "neighbours": "mix of periods, Asian-influenced landscaping",
        "finish_level": "mid to high",
        "typical_lots": "500-700sqm",
        "character": "Strong Asian community, excellent schools, modern developments"
    },
    "mount_waverley": {
        "style": "established family",
        "trees": "mature natives and exotics",
        "streets": "gentle slopes, suburban",
        "neighbours": "1970s brick, modern updates",
        "finish_level": "mid-range",
        "typical_lots": "600-800sqm",
        "character": "Family area with good schools, established gardens"
    },
    "burwood": {
        "style": "diverse suburban",
        "trees": "mixed street trees",
        "streets": "suburban, some high-density pockets",
        "neighbours": "varied ages, student housing near uni",
        "finish_level": "mid-range",
        "typical_lots": "500-700sqm",
        "character": "Near Deakin University, mix of housing types"
    },
    "ashburton": {
        "style": "established family",
        "trees": "mature natives and exotics",
        "streets": "quiet residential",
        "neighbours": "1950s-60s brick, quality rebuilds",
        "finish_level": "mid to high",
        "typical_lots": "600-800sqm",
        "character": "Village feel, family-oriented, quality redevelopments"
    },

    # Inner Suburbs
    "hawthorn": {
        "style": "heritage premium",
        "trees": "London planes, elms, mature gardens",
        "streets": "heritage overlays common",
        "neighbours": "Victorian, Edwardian, quality modern",
        "finish_level": "premium",
        "typical_lots": "400-800sqm",
        "character": "Inner-city prestige, heritage streetscapes, cafes and shopping"
    },
    "hawthorn_east": {
        "style": "established prestige",
        "trees": "mature trees, established gardens",
        "streets": "quieter than Hawthorn, leafy",
        "neighbours": "period and quality contemporary",
        "finish_level": "high-end",
        "typical_lots": "500-800sqm",
        "character": "Prestigious, quieter than Hawthorn, close to parks"
    },
    "richmond": {
        "style": "urban village",
        "trees": "street trees, small gardens",
        "streets": "narrow, inner city",
        "neighbours": "workers cottages, warehouses, apartments",
        "finish_level": "varied",
        "typical_lots": "200-400sqm",
        "character": "Inner-city urban, warehouse conversions, vibrant street life"
    },
    "south_yarra": {
        "style": "urban premium",
        "trees": "plane trees, ornamental",
        "streets": "mix of commercial and residential",
        "neighbours": "Victorian terraces, modern apartments",
        "finish_level": "premium",
        "typical_lots": "200-500sqm",
        "character": "High-end inner-city living, fashion and dining precinct"
    },
    "toorak": {
        "style": "prestige exclusive",
        "trees": "mature European trees, manicured gardens",
        "streets": "wide, leafy, exclusive",
        "neighbours": "grand mansions, architect-designed",
        "finish_level": "ultra-premium",
        "typical_lots": "800-2000sqm",
        "character": "Melbourne's most exclusive suburb, significant estates"
    },
    "armadale": {
        "style": "heritage premium",
        "trees": "plane trees, established gardens",
        "streets": "heritage shopping strip, leafy residential",
        "neighbours": "Victorian, Edwardian, quality modern",
        "finish_level": "premium",
        "typical_lots": "400-700sqm",
        "character": "High-end shopping, heritage homes, prestigious"
    },
    "malvern": {
        "style": "established prestige",
        "trees": "mature deciduous, well-maintained",
        "streets": "leafy residential, heritage pockets",
        "neighbours": "period homes, quality contemporary",
        "finish_level": "high-end",
        "typical_lots": "500-900sqm",
        "character": "Family prestige, excellent schools, established character"
    },
    "malvern_east": {
        "style": "family premium",
        "trees": "mature trees, gardens",
        "streets": "quiet residential",
        "neighbours": "period and modern mix",
        "finish_level": "high-end",
        "typical_lots": "600-800sqm",
        "character": "Family-focused, quieter, close to parks and schools"
    },

    # Northern Suburbs
    "ivanhoe": {
        "style": "established leafy",
        "trees": "mature natives, river red gums nearby",
        "streets": "hilly, winding in parts",
        "neighbours": "period homes, quality rebuilds",
        "finish_level": "mid to high",
        "typical_lots": "600-900sqm",
        "character": "Artistic community, close to Yarra River, leafy"
    },
    "heidelberg": {
        "style": "artistic heritage",
        "trees": "native gums, established gardens",
        "streets": "mix of terrains, some steep",
        "neighbours": "varied ages, artistic community",
        "finish_level": "mid-range",
        "typical_lots": "500-800sqm",
        "character": "Heidelberg School art connection, hospital precinct"
    },
    "eltham": {
        "style": "bush suburban",
        "trees": "native bushland, eucalypts",
        "streets": "winding, bush character",
        "neighbours": "mud brick, bush architecture",
        "finish_level": "varied",
        "typical_lots": "800-2000sqm",
        "character": "Artistic, environmental focus, bush blocks"
    },

    # Western Suburbs
    "essendon": {
        "style": "established character",
        "trees": "mature street trees, elm-lined",
        "streets": "heritage streetscapes",
        "neighbours": "Edwardian, Victorian, modern infill",
        "finish_level": "mid to high",
        "typical_lots": "500-700sqm",
        "character": "Character homes, cafe culture, family-oriented"
    },
    "moonee_ponds": {
        "style": "urban village",
        "trees": "plane trees, ornamental",
        "streets": "heritage overlay areas",
        "neighbours": "Victorian, Edwardian, apartments",
        "finish_level": "mid to high",
        "typical_lots": "400-600sqm",
        "character": "Queens Park nearby, heritage shopping, inner-northwest"
    },

    # Bayside Suburbs
    "brighton": {
        "style": "coastal premium",
        "trees": "mature trees, salt-tolerant plantings",
        "streets": "wide, leafy, beach proximity",
        "neighbours": "grand homes, modern luxury",
        "finish_level": "premium",
        "typical_lots": "600-1200sqm",
        "character": "Beachside prestige, bathing boxes, family estates"
    },
    "sandringham": {
        "style": "coastal family",
        "trees": "tea trees, coastal natives, Norfolk pines",
        "streets": "village feel, beach access",
        "neighbours": "character homes, modern rebuilds",
        "finish_level": "high-end",
        "typical_lots": "500-800sqm",
        "character": "Village atmosphere, beach lifestyle, family-focused"
    },
    "elwood": {
        "style": "beachside eclectic",
        "trees": "palms, plane trees, salt-tolerant",
        "streets": "mix of apartments and houses",
        "neighbours": "Art Deco, Victorian, modern apartments",
        "finish_level": "varied",
        "typical_lots": "300-600sqm",
        "character": "Bohemian beach suburb, cafes, diverse housing"
    }
}


def get_suburb_context(suburb_name: str) -> dict:
    """
    Get the context for a Melbourne suburb.
    Returns default context if suburb not found.
    """
    # Normalize suburb name
    normalized = suburb_name.lower().strip().replace(" ", "_").replace("-", "_")

    if normalized in MELBOURNE_SUBURBS:
        return MELBOURNE_SUBURBS[normalized]

    # Return default context for unknown suburbs
    return {
        "style": "contemporary suburban",
        "trees": "mix of native and exotic trees",
        "streets": "typical suburban streets",
        "neighbours": "mixed housing types",
        "finish_level": "mid-range",
        "typical_lots": "500-700sqm",
        "character": "Melbourne suburban area"
    }


def build_suburb_context_prompt(suburb_name: str) -> str:
    """
    Build a prompt section describing the suburb context for image generation.
    """
    context = get_suburb_context(suburb_name)

    return f"""
MELBOURNE SUBURB CONTEXT - {suburb_name.replace('_', ' ').title()}:

Neighbourhood Character: {context['character']}
Architectural Style: {context['style']}
Street Trees: {context['trees']}
Street Character: {context['streets']}
Neighbouring Properties: {context['neighbours']}
Finish Level Expected: {context['finish_level']}
Typical Lot Sizes: {context['typical_lots']}

The generated images must reflect this specific Melbourne suburb's character.
Include appropriate vegetation, neighbouring property styles, and finish levels.
"""
