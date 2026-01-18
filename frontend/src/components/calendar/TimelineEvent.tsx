import { Box, Typography, useTheme } from '@mui/material';
import { Session } from '../../types';
import { useUIContext, useThemeContext } from '../../contexts';
import { formatTime } from '../../utils/dateUtils';
import { getCityAbbr, getFacilityKey, isDiscountSession } from '../../utils/filterUtils';
import { getActivityColor } from '../../theme/theme';

interface TimelineEventProps {
  session: Session;
  top: number;
  height: number;
  left: number;
  width: number;
  isPast: boolean;
}

export function TimelineEvent({
  session,
  top,
  height,
  left,
  width,
  isPast,
}: TimelineEventProps) {
  const theme = useTheme();
  const { openSessionModal, setHighlightedFacility, highlightedFacility } = useUIContext();
  const { sport } = useThemeContext();

  const facilityKey = getFacilityKey(session.facility);
  const isHighlighted = highlightedFacility === facilityKey;
  const isDiscount = isDiscountSession(session);
  const colors = getActivityColor(session.type, sport, isDiscount, theme.palette.mode);

  return (
    <Box
      onClick={() => openSessionModal(session)}
      onMouseEnter={() => setHighlightedFacility(facilityKey)}
      onMouseLeave={() => setHighlightedFacility(null)}
      data-facility={facilityKey}
      sx={{
        position: 'absolute',
        top: `${top}px`,
        height: `${height}px`,
        left: `${left}%`,
        width: `${width}%`,
        borderRadius: 1.5,
        p: 0.75,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: isHighlighted ? '0 0 0 3px #ffd700, 0 4px 15px rgba(255, 215, 0, 0.5)' : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        zIndex: isHighlighted ? 100 : 2,
        minWidth: '140px',
        boxSizing: 'border-box',
        bgcolor: colors.bg,
        borderLeft: '4px solid',
        borderLeftColor: colors.main,
        opacity: isPast ? 0.5 : 1,
        filter: isPast ? 'grayscale(30%)' : 'none',
        transform: isHighlighted ? 'scale(1.02)' : 'none',
        '&:hover': {
          transform: isHighlighted ? 'scale(1.02)' : 'translateX(3px)',
          boxShadow: isHighlighted
            ? '0 0 0 3px #ffd700, 0 4px 15px rgba(255, 215, 0, 0.5)'
            : 2,
        },
        '&::after': isPast
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }
          : undefined,
      }}
    >
      <Typography
        sx={{
          position: 'absolute',
          top: 2,
          right: 4,
          fontSize: '0.55rem',
          fontWeight: 600,
          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
          letterSpacing: 0.5,
        }}
      >
        {getCityAbbr(session.city)}
      </Typography>

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '0.75rem',
          mb: 0.25,
          color: 'text.primary',
        }}
      >
        {formatTime(session.startTime)} - {formatTime(session.endTime)}
      </Typography>

      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.8rem',
          mb: 0.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'text.primary',
        }}
      >
        {session.activityName || session.type}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.7rem',
          color: 'text.secondary',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {session.facility}
      </Typography>
    </Box>
  );
}
