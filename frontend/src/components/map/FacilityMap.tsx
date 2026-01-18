import { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDataContext, useFilterContext, useUIContext, useThemeContext } from '../../contexts';
import { getCityMarkerColor } from '../../utils/mapUtils';
import { formatTime } from '../../utils/dateUtils';
import { format } from 'date-fns';

// Custom marker icon factory
function createMarkerIcon(color: string, count: number, facilityKey: string, isHighlighted: boolean): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-icon ${isHighlighted ? 'map-marker-highlighted' : ''}" data-facility="${facilityKey}" style="
      background: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      transition: transform 0.2s;
      ${isHighlighted ? 'transform: scale(1.3);' : ''}
    ">${count}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// Component to fit map bounds
function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
}

export function FacilityMap() {
  const { facilities } = useDataContext();
  const { userLocation, distance } = useFilterContext();
  const { highlightedFacility, setHighlightedFacility } = useUIContext();
  const { isDarkMode } = useThemeContext();

  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isDarkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Calculate bounds for all markers
  const bounds = useMemo(() => {
    if (facilities.length === 0) return null;

    const latLngs = facilities.map((f) => [f.lat, f.lng] as [number, number]);
    if (userLocation && distance < 999) {
      latLngs.push([userLocation.lat, userLocation.lng]);
    }

    return L.latLngBounds(latLngs);
  }, [facilities, userLocation, distance]);

  return (
    <Box sx={{ height: { xs: 250, sm: 350 }, minHeight: 200 }}>
      <MapContainer
        center={[49.25, -123.1]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer url={tileUrl} attribution={attribution} />

        <FitBounds bounds={bounds} />

        {/* Facility markers */}
        {facilities.map((facility) => {
          const facilityKey = facility.name.replace(/[^a-zA-Z0-9]/g, '-');
          const color = getCityMarkerColor(facility.city, facility.name);
          const isHighlighted = highlightedFacility === facilityKey;
          const icon = createMarkerIcon(color, facility.sessions.length, facilityKey, isHighlighted);

          const upcomingSessions = facility.sessions
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            .slice(0, 5);

          return (
            <Marker
              key={facilityKey}
              position={[facility.lat, facility.lng]}
              icon={icon}
              eventHandlers={{
                mouseover: () => setHighlightedFacility(facilityKey),
                mouseout: () => setHighlightedFacility(null),
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 14, fontWeight: 'bold', color: '#1976d2', textDecoration: 'none' }}
                  >
                    {facility.name}
                  </a>
                  <br />
                  <span style={{ color: '#666', fontSize: 12 }}>{facility.address}</span>
                  <br />
                  <span style={{ color, fontWeight: 600 }}>
                    {facility.sessions.length} upcoming sessions
                  </span>
                  <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
                  {upcomingSessions.map((session, idx) => {
                    const dateObj = new Date(session.date + 'T00:00:00');
                    const dateStr = format(dateObj, 'EEE, MMM d');
                    return (
                      <div key={idx} style={{ marginBottom: 6, fontSize: 12 }}>
                        <strong>{dateStr}</strong> {formatTime(session.startTime)}-
                        {formatTime(session.endTime)}
                        <br />
                        <span style={{ color: '#555' }}>{session.activityName || session.type}</span>
                      </div>
                    );
                  })}
                  {facility.sessions.length > 5 && (
                    <div style={{ color: '#667eea', fontSize: 11 }}>
                      +{facility.sessions.length - 5} more sessions
                    </div>
                  )}
                </Box>
              </Popup>
            </Marker>
          );
        })}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-marker',
              html: `<div style="
                background: #e74c3c;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>Your location</Popup>
          </Marker>
        )}

        {/* Distance circle */}
        {userLocation && distance < 999 && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={distance * 1000}
            pathOptions={{
              color: '#667eea',
              fillColor: '#667eea',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}
      </MapContainer>
    </Box>
  );
}
