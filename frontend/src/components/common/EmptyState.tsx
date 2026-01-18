import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  message?: string;
  submessage?: string;
}

export function EmptyState({
  message = 'No sessions scheduled for this day',
  submessage = 'Try selecting different filters or another date',
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 1,
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
        {submessage}
      </Typography>
    </Box>
  );
}
