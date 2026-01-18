import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Link,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useUIContext, useFilterContext } from '../../contexts';
import {
  formatTime,
  formatDuration,
  calculateDuration,
  getRelativeTime,
} from '../../utils/dateUtils';
import { getGoogleMapsUrl, getGoogleCalendarUrl, calculateDistance } from '../../utils/mapUtils';
import { format } from 'date-fns';

export function SessionModal() {
  const { isSessionModalOpen, selectedSession, closeSessionModal } = useUIContext();
  const { userLocation } = useFilterContext();

  if (!selectedSession) return null;

  const session = selectedSession;
  const activityName = session.activityName || session.type;
  const durationMins = calculateDuration(session.startTime, session.endTime);
  const durationStr = formatDuration(durationMins);
  const relativeTime = getRelativeTime(session.date, session.startTime);
  const relativeStr = relativeTime ? ` (${relativeTime})` : '';

  const mapsUrl = getGoogleMapsUrl(session.address, session.city);
  const calendarUrl = getGoogleCalendarUrl(
    `${session.type} - ${session.facility}`,
    session.address,
    session.date,
    session.startTime,
    session.endTime,
    `${session.type} at ${session.facility}`
  );

  const distanceKm = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, session.lat, session.lng)
    : null;

  const dateObj = new Date(session.date + 'T00:00:00');
  const dateStr = format(dateObj, 'EEEE, MMMM d, yyyy');

  return (
    <Dialog
      open={isSessionModalOpen}
      onClose={closeSessionModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, pr: 4 }}>
          {activityName}
        </Typography>
        <IconButton
          onClick={closeSessionModal}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <DetailRow label="Activity" value={activityName} />
          <DetailRow label="Type" value={session.type} />

          {session.ageRange && <DetailRow label="Age Range" value={session.ageRange} />}

          <DetailRow
            label="Date"
            value={
              <>
                {dateStr}
                {relativeStr && (
                  <Typography component="span" color="primary.main" sx={{ ml: 0.5 }}>
                    {relativeStr}
                  </Typography>
                )}
              </>
            }
          />

          <DetailRow
            label="Time"
            value={`${formatTime(session.startTime)} - ${formatTime(session.endTime)} (${durationStr})`}
          />

          <DetailRow
            label="Location"
            value={
              <Link href={mapsUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                {session.facility}
              </Link>
            }
          />

          <DetailRow label="Address" value={`${session.address}, ${session.city}`} />

          {distanceKm !== null && (
            <DetailRow label="Distance" value={`${distanceKm.toFixed(1)} km away`} />
          )}

          {session.scheduleUrl && (
            <DetailRow
              label="Schedule"
              value={
                <Link
                  href={session.scheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                >
                  View facility schedule
                </Link>
              }
            />
          )}

          {session.description && <DetailRow label="Description" value={session.description} />}

          <Divider />

          {session.activityUrl && (
            <Button
              variant="contained"
              fullWidth
              href={session.activityUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0f8a80 0%, #32d970 100%)',
                },
              }}
            >
              Reserve / Register
            </Button>
          )}

          <Button
            variant="contained"
            fullWidth
            startIcon={<CalendarMonthIcon />}
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4192 100%)',
              },
            }}
          >
            Add to Google Calendar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Box>
      <Typography
        variant="body2"
        color="primary.main"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        {label}:
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}
