import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useDataContext, useFilterContext } from '../../contexts';
import { formatDateStr } from '../../utils/dateUtils';
import { calculateDistance } from '../../utils/mapUtils';
import { TimelineEvent } from './TimelineEvent';
import { DayPicker } from './DayPicker';
import { EmptyState } from '../common/EmptyState';
import { Session } from '../../types';

interface TimelineEventData {
  session: Session;
  start: number;
  end: number;
  column: number;
  totalColumns: number;
}

export function DayView() {
  const { currentDate, filteredSessions } = useDataContext();
  const { userLocation } = useFilterContext();

  const dateStr = formatDateStr(currentDate);

  // Filter and sort sessions for this day
  const daySessions = useMemo(() => {
    return filteredSessions
      .filter((s) => s.date === dateStr)
      .sort((a, b) => {
        const timeCompare = a.startTime.localeCompare(b.startTime);
        if (timeCompare !== 0) return timeCompare;
        if (userLocation) {
          const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
        }
        return 0;
      });
  }, [filteredSessions, dateStr, userLocation]);

  // Calculate timeline parameters
  const { startHour, endHour, events, globalMaxColumns } = useMemo(() => {
    if (daySessions.length === 0) {
      return { startHour: 8, endHour: 20, events: [], globalMaxColumns: 1 };
    }

    const minHour = Math.max(
      6,
      Math.min(...daySessions.map((s) => parseInt(s.startTime.split(':')[0]))) - 1
    );
    const maxHour = Math.min(
      23,
      Math.max(...daySessions.map((s) => parseInt(s.endTime.split(':')[0]))) + 1
    );

    // Build events with minute positions
    const evts: TimelineEventData[] = daySessions.map((session) => {
      const [startH, startM] = session.startTime.split(':').map(Number);
      const [endH, endM] = session.endTime.split(':').map(Number);
      return {
        session,
        start: startH * 60 + startM,
        end: endH * 60 + endM,
        column: 0,
        totalColumns: 1,
      };
    });

    // Assign columns for overlapping events
    for (let i = 0; i < evts.length; i++) {
      const event = evts[i];
      const overlapping = evts.slice(0, i).filter(
        (e) => e.end > event.start && e.start < event.end
      );
      const usedColumns = overlapping.map((e) => e.column);
      let col = 0;
      while (usedColumns.includes(col)) col++;
      event.column = col;
    }

    // Calculate total columns for each event group
    let maxCols = 1;
    for (let i = 0; i < evts.length; i++) {
      const event = evts[i];
      const overlapping = evts.filter(
        (e) => e.end > event.start && e.start < event.end
      );
      const maxCol = Math.max(...overlapping.map((e) => e.column)) + 1;
      overlapping.forEach((e) => {
        e.totalColumns = Math.max(e.totalColumns, maxCol);
      });
      maxCols = Math.max(maxCols, maxCol);
    }

    return {
      startHour: minHour,
      endHour: maxHour,
      events: evts,
      globalMaxColumns: maxCols,
    };
  }, [daySessions]);

  // Calculate current time for NOW line
  const now = new Date();
  const isToday = formatDateStr(now) === dateStr;
  const currentMinutes = isToday
    ? (now.getHours() - startHour) * 60 + now.getMinutes()
    : -1;
  const showNowLine =
    isToday && currentMinutes >= 0 && currentMinutes <= (endHour - startHour + 1) * 60;

  // Calculate grid width for horizontal scrolling
  const MIN_COLUMN_WIDTH = 180;
  const SCROLL_THRESHOLD = 5;
  const needsScroll = globalMaxColumns > SCROLL_THRESHOLD;
  const gridWidth = needsScroll ? globalMaxColumns * MIN_COLUMN_WIDTH : undefined;

  return (
    <Box>
      <DayPicker />

      {daySessions.length === 0 ? (
        <EmptyState />
      ) : (
        <Box
          sx={{
            position: 'relative',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          {/* Hour labels */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: { xs: 45, sm: 60 },
              bgcolor: 'action.hover',
              borderRight: 1,
              borderColor: 'divider',
              zIndex: 1,
            }}
          >
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
              const hour = startHour + i;
              const displayHour = hour % 12 || 12;
              const ampm = hour >= 12 ? 'PM' : 'AM';
              return (
                <Box
                  key={hour}
                  sx={{
                    height: 60,
                    px: { xs: 0.5, sm: 1 },
                    py: 0.5,
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    color: 'text.secondary',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {displayHour}:00 {ampm}
                </Box>
              );
            })}
          </Box>

          {/* Timeline grid */}
          <Box
            sx={{
              ml: { xs: '50px', sm: '70px' },
              mr: 1,
              position: 'relative',
              minHeight: (endHour - startHour + 1) * 60,
              minWidth: 400,
              width: gridWidth,
            }}
          >
            {/* Hour lines */}
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  height: 60,
                  borderBottom: 1,
                  borderColor: 'divider',
                  opacity: 0.5,
                }}
              />
            ))}

            {/* Events */}
            {events.map(({ session, start, end, column, totalColumns }, idx) => {
              const startMinutes = start - startHour * 60;
              const durationMins = end - start;
              const height = Math.max(durationMins, 55);
              const width = 100 / totalColumns - 1;
              const left = column * (100 / totalColumns);

              // Check if past
              const [endH, endM] = session.endTime.split(':').map(Number);
              const isPast =
                isToday && endH * 60 + endM < now.getHours() * 60 + now.getMinutes();

              return (
                <TimelineEvent
                  key={`${session.facility}-${session.startTime}-${idx}`}
                  session={session}
                  top={startMinutes}
                  height={height}
                  left={left}
                  width={width}
                  isPast={isPast}
                />
              );
            })}

            {/* NOW line */}
            {showNowLine && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${currentMinutes}px`,
                  height: 2,
                  bgcolor: 'error.main',
                  zIndex: 10,
                  '&::before': {
                    content: '"NOW"',
                    position: 'absolute',
                    left: -45,
                    top: -8,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'error.main',
                    bgcolor: 'background.paper',
                    px: 0.5,
                    borderRadius: 0.5,
                  },
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
