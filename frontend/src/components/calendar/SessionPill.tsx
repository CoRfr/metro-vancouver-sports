import { Chip, useTheme } from '@mui/material';
import { Session } from '../../types';
import { useUIContext, useThemeContext } from '../../contexts';
import { formatTime } from '../../utils/dateUtils';
import { shortFacilityName, getFacilityKey, isDiscountSession } from '../../utils/filterUtils';
import { getActivityColor } from '../../theme/theme';

interface SessionPillProps {
  session: Session;
  showFacility?: boolean;
}

export function SessionPill({ session, showFacility = true }: SessionPillProps) {
  const theme = useTheme();
  const { openSessionModal, setHighlightedFacility, highlightedFacility } = useUIContext();
  const { sport } = useThemeContext();

  const facilityKey = getFacilityKey(session.facility);
  const isHighlighted = highlightedFacility === facilityKey;
  const isDiscount = isDiscountSession(session);
  const colors = getActivityColor(session.type, sport, isDiscount, theme.palette.mode);

  const label = showFacility
    ? `${formatTime(session.startTime)} ${shortFacilityName(session.facility)}`
    : formatTime(session.startTime);

  return (
    <Chip
      label={label}
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        openSessionModal(session);
      }}
      onMouseEnter={() => setHighlightedFacility(facilityKey)}
      onMouseLeave={() => setHighlightedFacility(null)}
      data-facility={facilityKey}
      sx={{
        bgcolor: colors.bg,
        color: theme.palette.mode === 'dark' ? '#fff' : colors.main,
        border: 1,
        borderColor: colors.border,
        fontWeight: 500,
        fontSize: '0.75rem',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: isHighlighted ? 'scale(1.05)' : 'none',
        boxShadow: isHighlighted ? '0 0 0 2px #ffd700' : 'none',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
    />
  );
}
