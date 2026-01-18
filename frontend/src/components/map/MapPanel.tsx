import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useDataContext, useUIContext } from '../../contexts';
import { FacilityMap } from './FacilityMap';
import { MapLegend } from './MapLegend';
import { FacilityTable } from './FacilityTable';

export function MapPanel() {
  const { filteredSessions, facilities } = useDataContext();
  const { isMapPanelOpen, setMapPanelOpen } = useUIContext();

  const sessionCount = filteredSessions.length;
  const facilityCount = facilities.length;

  const title =
    sessionCount > 0
      ? `${sessionCount} Sessions at ${facilityCount} Facilities`
      : 'Facility Map';

  return (
    <Accordion
      expanded={isMapPanelOpen}
      onChange={(_, expanded) => setMapPanelOpen(expanded)}
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #0f8a80 0%, #32d970 100%)',
          },
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
        sx={{
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        <LocationOnIcon />
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <FacilityMap />
        <MapLegend />
        <FacilityTable />
      </AccordionDetails>
    </Accordion>
  );
}
