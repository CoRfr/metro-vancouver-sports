import { Box, CircularProgress, Typography } from '@mui/material';
import { useThemeContext } from '../../contexts';

export function LoadingSpinner() {
  const { sport } = useThemeContext();
  const icon = sport === 'skating' ? '⛸️' : '🏊';
  const text = sport === 'skating' ? 'Loading skating sessions...' : 'Loading swimming sessions...';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <Typography variant="h2" component="div" sx={{ fontSize: '3rem' }}>
        {icon}
      </Typography>
      <CircularProgress color="primary" />
      <Typography
        variant="h6"
        sx={{
          color: 'primary.main',
          fontWeight: 600,
        }}
      >
        {text}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Fetching data from Metro Vancouver recreation centers
      </Typography>
    </Box>
  );
}
