/**
 * Geocoding utilities for location-based candidate search
 */

export interface GeocodeResult {
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Parse and normalize US state names/codes
 */
export const normalizeState = (state: string): string => {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  };

  const normalized = state.trim().toLowerCase();

  // If it's already a 2-letter code, return uppercase
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }

  // Otherwise look up full name
  return stateMap[normalized] || state.toUpperCase();
};

/**
 * Validate and normalize zip code
 */
export const normalizeZipCode = (zipCode: string): string | null => {
  const cleaned = zipCode.replace(/\D/g, '');

  if (cleaned.length === 5) {
    return cleaned;
  }

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }

  return null;
};

/**
 * Extract location components from a search query
 */
export const parseLocationQuery = (query: string): Partial<GeocodeResult> => {
  const result: Partial<GeocodeResult> = {};

  // Try to extract zip code
  const zipMatch = query.match(/\b\d{5}(?:-\d{4})?\b/);
  if (zipMatch) {
    result.zipCode = normalizeZipCode(zipMatch[0]) || undefined;
  }

  // Try to extract state (2-letter code at end)
  const stateMatch = query.match(/,?\s*([A-Z]{2})\s*$/i);
  if (stateMatch) {
    result.state = normalizeState(stateMatch[1]);
  }

  return result;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};
