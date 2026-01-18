import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  Typography,
} from '@mui/material';
import { useDataContext, useUIContext } from '../../contexts';
import { getCityMarkerColor } from '../../utils/mapUtils';
import { getFacilityKey } from '../../utils/filterUtils';

export function FacilityTable() {
  const { facilities } = useDataContext();
  const { highlightedFacility, setHighlightedFacility } = useUIContext();

  if (facilities.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No facilities match current filters
        </Typography>
      </Box>
    );
  }

  const sortedFacilities = [...facilities].sort(
    (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
  );

  return (
    <TableContainer sx={{ maxHeight: 200, px: 2, py: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Sessions</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Schedule</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedFacilities.map((facility) => {
            const facilityKey = getFacilityKey(facility.name);
            const color = getCityMarkerColor(facility.city, facility.name);
            const isHighlighted = highlightedFacility === facilityKey;
            const scheduleUrl = facility.sessions[0]?.scheduleUrl;
            const facilityUrl = facility.sessions[0]?.facilityUrl || scheduleUrl;

            const distanceText =
              facility.distance !== undefined
                ? `, ${facility.distance.toFixed(1)}km`
                : '';

            return (
              <TableRow
                key={facilityKey}
                data-facility={facilityKey}
                onMouseEnter={() => setHighlightedFacility(facilityKey)}
                onMouseLeave={() => setHighlightedFacility(null)}
                sx={{
                  bgcolor: isHighlighted ? 'action.hover' : 'transparent',
                  boxShadow: isHighlighted ? 'inset 3px 0 0 #ffd700' : 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: color,
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      {facilityUrl ? (
                        <Link
                          href={facilityUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {facility.name}
                        </Link>
                      ) : (
                        facility.name
                      )}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 0.5, color: 'text.secondary' }}
                      >
                        ({facility.city}
                        {distanceText})
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{facility.sessions.length}</TableCell>
                <TableCell>
                  {scheduleUrl ? (
                    <Link
                      href={scheduleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                    >
                      View
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
