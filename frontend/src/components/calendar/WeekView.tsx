import { useMemo } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { useDataContext, useFilterContext } from '../../contexts';
import { formatDateStr, isToday as checkIsToday } from '../../utils/dateUtils';
import { calculateDistance } from '../../utils/mapUtils';
import { SessionPill } from './SessionPill';
import { startOfWeek, addDays, format } from 'date-fns';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekView() {
  const { currentDate, filteredSessions, setCurrentDate, setViewMode } = useDataContext();
  const { userLocation } = useFilterContext();

  const weekStart = startOfWeek(currentDate);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = formatDateStr(date);
      const sessions = filteredSessions
        .filter((s) => s.date === dateStr)
        .sort((a, b) => {
          const timeCompare = a.startTime.localeCompare(b.startTime);
          if (timeCompare !== 0) return timeCompare;
          if (userLocation) {
            const distA = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              a.lat,
              a.lng
            );
            const distB = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              b.lat,
              b.lng
            );
            return distA - distB;
          }
          return 0;
        });

      return {
        date,
        dateStr,
        sessions,
        isToday: checkIsToday(date),
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      };
    });
  }, [weekStart, filteredSessions, currentDate, userLocation]);

  const handleDayClick = (dateStr: string) => {
    setCurrentDate(new Date(dateStr + 'T00:00:00'));
    setViewMode('day');
  };

  return (
    <Box>
      {/* Day headers */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {DAY_NAMES.map((name) => (
          <Grid item xs key={name} sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '0.9rem',
              }}
            >
              {name}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Day cells */}
      <Grid container spacing={1}>
        {weekDays.map(({ date, dateStr, sessions, isToday, isCurrentMonth }) => (
          <Grid item xs key={dateStr}>
            <Paper
              onClick={() => handleDayClick(dateStr)}
              sx={{
                minHeight: 120,
                p: 1,
                cursor: 'pointer',
                border: 2,
                borderColor: isToday ? 'primary.main' : 'divider',
                bgcolor: isToday ? 'primary.50' : 'background.default',
                opacity: isCurrentMonth ? 1 : 0.3,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'background.paper',
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  mb: 0.5,
                }}
              >
                {format(date, 'd')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {sessions.slice(0, 4).map((session, idx) => (
                  <SessionPill key={`${session.facility}-${session.startTime}-${idx}`} session={session} />
                ))}
                {sessions.length > 4 && (
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: 'action.hover',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}
                  >
                    +{sessions.length - 4} more
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
