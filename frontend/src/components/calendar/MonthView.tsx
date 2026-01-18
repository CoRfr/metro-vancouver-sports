import { useMemo } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { useDataContext } from '../../contexts';
import { formatDateStr, isToday as checkIsToday } from '../../utils/dateUtils';
import { SessionPill } from './SessionPill';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
} from 'date-fns';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView() {
  const { currentDate, filteredSessions, setCurrentDate, setViewMode } = useDataContext();

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const result: Array<
      Array<{
        date: Date;
        dateStr: string;
        sessions: typeof filteredSessions;
        isToday: boolean;
        isCurrentMonth: boolean;
      }>
    > = [];

    let day = calendarStart;
    while (day <= calendarEnd) {
      const week: typeof result[0] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = formatDateStr(day);
        const sessions = filteredSessions.filter((s) => s.date === dateStr);
        week.push({
          date: new Date(day),
          dateStr,
          sessions,
          isToday: checkIsToday(day),
          isCurrentMonth: isSameMonth(day, currentDate),
        });
        day = addDays(day, 1);
      }
      result.push(week);
    }

    return result;
  }, [currentDate, filteredSessions]);

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

      {/* Calendar grid */}
      {weeks.map((week, weekIdx) => (
        <Grid container spacing={1} key={weekIdx} sx={{ mb: 1 }}>
          {week.map(({ date, dateStr, sessions, isToday, isCurrentMonth }) => (
            <Grid item xs key={dateStr}>
              <Paper
                onClick={() => handleDayClick(dateStr)}
                sx={{
                  minHeight: { xs: 80, sm: 100 },
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
                  {sessions.slice(0, 3).map((session, idx) => (
                    <SessionPill
                      key={`${session.facility}-${session.startTime}-${idx}`}
                      session={session}
                      showFacility={false}
                    />
                  ))}
                  {sessions.length > 3 && (
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: 'action.hover',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        color: 'text.secondary',
                        textAlign: 'center',
                        fontSize: '0.65rem',
                      }}
                    >
                      +{sessions.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ))}
    </Box>
  );
}
