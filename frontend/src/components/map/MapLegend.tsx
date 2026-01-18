import { Box, Typography } from '@mui/material';
import { useThemeContext } from '../../contexts';
import { CITY_COLORS } from '../../types';

const legendItems = [
  { city: 'Vancouver', color: CITY_COLORS['Vancouver'] },
  { city: 'Burnaby', color: CITY_COLORS['Burnaby'] },
  { city: 'Richmond', color: CITY_COLORS['Richmond'] },
  { city: 'Port Coquitlam', color: CITY_COLORS['Port Coquitlam'] },
  { city: 'Coquitlam', color: CITY_COLORS['Coquitlam'] },
  { city: 'North Vancouver', color: CITY_COLORS['North Vancouver'] },
  { city: 'West Vancouver', color: CITY_COLORS['West Vancouver'] },
  { city: 'New Westminster', color: CITY_COLORS['New Westminster'] },
  { city: 'Langley', color: CITY_COLORS['Langley'] },
];

export function MapLegend() {
  const { sport } = useThemeContext();

  return (
    <Box
      sx={{
        py: 1,
        px: 2.5,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        fontSize: '0.85rem',
      }}
    >
      {legendItems.map((item) => (
        <Box
          key={item.city}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: item.color,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {item.city}
          </Typography>
        </Box>
      ))}
      {sport === 'skating' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#ef6c00',
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Outdoor Rinks
          </Typography>
        </Box>
      )}
    </Box>
  );
}
