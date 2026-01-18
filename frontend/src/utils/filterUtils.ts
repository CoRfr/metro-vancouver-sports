import { Session, Sport, SPORTS_CONFIG } from '../types';
import { calculateDistance } from './mapUtils';

export function isDiscountSession(session: Session): boolean {
  const actName = (session.activityName || '').toLowerCase();
  return (
    actName.includes('toonie') ||
    actName.includes('discount') ||
    actName.includes('free') ||
    actName.includes('loonie') ||
    actName.includes('$2')
  );
}

export function filterSessions(
  sessions: Session[],
  selectedCities: string[],
  selectedFacilities: string[],
  selectedActivityTypes: string[],
  distance: number,
  userLocation: { lat: number; lng: number } | null,
  sport: Sport
): Session[] {
  const showDiscount = selectedActivityTypes.includes('__discount__');
  const showPublic = selectedActivityTypes.includes('Public Skating');
  const regularTypes = selectedActivityTypes.filter((t) => t !== '__discount__');

  return sessions.filter((session) => {
    // City filter
    const cityMatch = selectedCities.length === 0 || selectedCities.includes(session.city);

    // Facility filter
    const facilityMatch =
      selectedFacilities.length === 0 || selectedFacilities.includes(session.facility);

    // Activity type matching
    let activityMatch = false;
    const isDiscount = isDiscountSession(session);

    if (sport === 'skating') {
      // Discount sessions only shown if Discount filter is checked
      if (isDiscount && session.type === 'Public Skating') {
        activityMatch = showDiscount;
      } else if (session.type === 'Public Skating') {
        // Regular public skating (non-discount)
        activityMatch = showPublic;
      } else {
        // Other types
        activityMatch = regularTypes.includes(session.type);
      }
    } else {
      // Swimming - simpler type matching
      activityMatch = regularTypes.includes(session.type);
    }

    // Distance filter
    let distanceMatch = true;
    if (userLocation && distance < 999) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        session.lat,
        session.lng
      );
      distanceMatch = dist <= distance;
    }

    return cityMatch && facilityMatch && distanceMatch && activityMatch;
  });
}

export function getDefaultActivityTypes(sport: Sport): string[] {
  const config = SPORTS_CONFIG[sport];
  return config.activityTypes.filter((t) => t.checked && !t.isAll).map((t) => t.value);
}

export function shortFacilityName(facility: string): string {
  const shortNames: Record<string, string> = {
    'Hillcrest Centre': 'Hillcrest',
    'Kerrisdale Cyclone Taylor Arena': 'Kerrisdale',
    'Killarney Rink': 'Killarney',
    'Kitsilano Rink': 'Kitsilano',
    'Sunset Rink': 'Sunset',
    'Trout Lake Rink': 'Trout Lake',
    'West End Community Centre': 'West End',
    'Kensington Complex': 'Kensington',
    'Rosemary Brown Recreation Centre': 'Rosemary Brown',
    'Bill Copeland Sports Centre': 'Bill Copeland',
    'Burnaby Lake Arena': 'Burnaby Lake',
    'Karen Magnussen Community Centre': 'Karen Magnussen',
    'Harry Jerome Community Recreation Centre': 'Harry Jerome',
    'Canlan Ice Sports North Shore': 'Canlan',
    'West Vancouver Community Centre': 'West Van CC',
    'Robson Square Ice Rink': 'Robson Square',
    'Shipyards Skate Plaza': 'Shipyards',
    "Queen's Park Arena": "Queen's Park",
    'Moody Park Arena': 'Moody Park',
  };
  return shortNames[facility] || facility.split(' ').slice(0, 2).join(' ');
}

export function getCityAbbr(city: string): string {
  const abbrs: Record<string, string> = {
    Vancouver: 'VAN',
    Burnaby: 'BBY',
    Richmond: 'RMD',
    'Port Coquitlam': 'PCQ',
    Coquitlam: 'COQ',
    'North Vancouver': 'NV',
    'West Vancouver': 'WV',
    'New Westminster': 'NW',
    Langley: 'LGL',
  };
  return abbrs[city] || city.substring(0, 3).toUpperCase();
}

export function getFacilityKey(facilityName: string): string {
  return facilityName.replace(/[^a-zA-Z0-9]/g, '-');
}
