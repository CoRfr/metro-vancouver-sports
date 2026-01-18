export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function geocodePostalCode(
  postalCode: string
): Promise<{ lat: number; lng: number } | null> {
  const cleanedCode = postalCode.replace(/\s/g, '').toUpperCase();
  if (cleanedCode.length < 6) return null;

  try {
    const response = await fetch(`https://geocoder.ca/${cleanedCode}?json=1`);
    const data = await response.json();
    if (data && data.latt && data.longt) {
      return {
        lat: parseFloat(data.latt),
        lng: parseFloat(data.longt),
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.address && data.address.postcode) {
      return data.address.postcode;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  return null;
}

export function getGoogleMapsUrl(address: string, city: string): string {
  const query = encodeURIComponent(address || `${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleCalendarUrl(
  title: string,
  location: string,
  date: string,
  startTime: string,
  endTime: string,
  description: string
): string {
  const startDateTime = `${date}T${startTime}:00`.replace(/[-:]/g, '');
  const endDateTime = `${date}T${endTime}:00`.replace(/[-:]/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location,
    dates: `${startDateTime}/${endDateTime}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Check if facility is an outdoor rink
export function isOutdoorRink(facilityName: string): boolean {
  return (
    facilityName.includes('Robson Square') || facilityName.includes('Shipyards')
  );
}

// Get color for city marker
export function getCityMarkerColor(city: string, facilityName: string): string {
  if (isOutdoorRink(facilityName)) {
    return '#ef6c00';
  }

  const cityColors: Record<string, string> = {
    Vancouver: '#1976d2',
    Burnaby: '#7b1fa2',
    Richmond: '#f57c00',
    'Port Coquitlam': '#5d4037',
    Coquitlam: '#6d4c41',
    'North Vancouver': '#388e3c',
    'West Vancouver': '#00796b',
    'New Westminster': '#c2185b',
    Langley: '#455a64',
  };

  return cityColors[city] || '#666';
}
