/**
 * Melbourne Suburbs Data for Quick-Select Dropdowns
 * Exported from agent/prompts/melbourne_suburbs.py
 */

export const MELBOURNE_SUBURBS = [
  // Eastern Suburbs (SQM's Primary Market)
  { value: "balwyn", label: "Balwyn", region: "Eastern" },
  { value: "balwyn_north", label: "Balwyn North", region: "Eastern" },
  { value: "camberwell", label: "Camberwell", region: "Eastern" },
  { value: "canterbury", label: "Canterbury", region: "Eastern" },
  { value: "doncaster", label: "Doncaster", region: "Eastern" },
  { value: "doncaster_east", label: "Doncaster East", region: "Eastern" },
  { value: "box_hill", label: "Box Hill", region: "Eastern" },
  { value: "box_hill_north", label: "Box Hill North", region: "Eastern" },
  { value: "templestowe", label: "Templestowe", region: "Eastern" },
  { value: "templestowe_lower", label: "Lower Templestowe", region: "Eastern" },
  { value: "kew", label: "Kew", region: "Eastern" },
  { value: "kew_east", label: "Kew East", region: "Eastern" },

  // South Eastern Suburbs
  { value: "glen_waverley", label: "Glen Waverley", region: "South Eastern" },
  { value: "mount_waverley", label: "Mount Waverley", region: "South Eastern" },
  { value: "burwood", label: "Burwood", region: "South Eastern" },
  { value: "ashburton", label: "Ashburton", region: "South Eastern" },

  // Inner Suburbs
  { value: "hawthorn", label: "Hawthorn", region: "Inner" },
  { value: "hawthorn_east", label: "Hawthorn East", region: "Inner" },
  { value: "richmond", label: "Richmond", region: "Inner" },
  { value: "south_yarra", label: "South Yarra", region: "Inner" },
  { value: "toorak", label: "Toorak", region: "Inner" },
  { value: "armadale", label: "Armadale", region: "Inner" },
  { value: "malvern", label: "Malvern", region: "Inner" },
  { value: "malvern_east", label: "Malvern East", region: "Inner" },

  // Northern Suburbs
  { value: "ivanhoe", label: "Ivanhoe", region: "Northern" },
  { value: "heidelberg", label: "Heidelberg", region: "Northern" },
  { value: "eltham", label: "Eltham", region: "Northern" },

  // Western Suburbs
  { value: "essendon", label: "Essendon", region: "Western" },
  { value: "moonee_ponds", label: "Moonee Ponds", region: "Western" },

  // Bayside Suburbs
  { value: "brighton", label: "Brighton", region: "Bayside" },
  { value: "sandringham", label: "Sandringham", region: "Bayside" },
  { value: "elwood", label: "Elwood", region: "Bayside" },
];

export const PROJECT_TYPES = [
  {
    value: "dual_occupancy",
    label: "Dual Occupancy",
    description: "Two homes on one block (side-by-side or front-back)"
  },
  {
    value: "townhouses",
    label: "Townhouses",
    description: "3-6 unit multi-dwelling development, 2-3 storeys"
  },
  {
    value: "apartments",
    label: "Apartments",
    description: "6-20 unit apartment building, 3-4 storeys"
  },
];

// Group suburbs by region for better UX
export const SUBURBS_BY_REGION = MELBOURNE_SUBURBS.reduce((acc, suburb) => {
  if (!acc[suburb.region]) {
    acc[suburb.region] = [];
  }
  acc[suburb.region].push(suburb);
  return acc;
}, {} as Record<string, typeof MELBOURNE_SUBURBS>);
