import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Link,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDataContext, useThemeContext } from '../../contexts';
import { getRelativeTimeString } from '../../utils/dateUtils';

interface DataSourceItem {
  city: string;
  label: string;
  url: string;
  info: string;
}

const dataSources: DataSourceItem[] = [
  {
    city: 'Vancouver',
    label: 'Vancouver',
    url: 'https://anc.ca.apm.activecommunities.com/vancouver/calendars?onlineSiteId=0&defaultCalendarId=3&displayType=0&view=2',
    info: 'ActiveNet Calendar API',
  },
  {
    city: 'Burnaby',
    label: 'Burnaby',
    url: 'https://www.burnaby.ca/recreation-and-arts/activities-and-registration/daily-activities?activity_tid=656',
    info: 'burnaby.ca (weekly schedules)',
  },
  {
    city: 'Richmond',
    label: 'Richmond',
    url: 'https://www.richmond.ca/parks-recreation/about/schedules.htm',
    info: 'richmond.ca (weekly schedules)',
  },
  {
    city: 'Coquitlam',
    label: 'Coquitlam',
    url: 'https://www.coquitlam.ca/979/Drop-In-Activities',
    info: 'coquitlam.ca (weekly schedules)',
  },
  {
    city: 'Port Coquitlam',
    label: 'Port Coquitlam',
    url: 'https://www.portcoquitlam.ca/recreation-parks/skating/public-skates',
    info: 'portcoquitlam.ca (weekly schedules)',
  },
  {
    city: 'North Vancouver',
    label: 'North Vancouver',
    url: 'https://www.nvrc.ca/drop-in-schedules?activity=551',
    info: 'NVRC Drop-in Schedules',
  },
  {
    city: 'West Vancouver',
    label: 'West Vancouver',
    url: 'https://westvancouver.ca/parks-recreation/recreation-programs-services/daily-activities-search-results',
    info: 'westvancouver.ca',
  },
  {
    city: 'New Westminster',
    label: 'New Westminster',
    url: 'https://cityofnewwestminster.perfectmind.com/23693/Clients/BookMe4BookingPages/Classes?calendarId=db250b43-ef6b-43c5-979e-3f3d1dab2d67',
    info: 'PerfectMind',
  },
  {
    city: 'Langley',
    label: 'Langley',
    url: 'https://www.tol.ca/en/parks-recreation/skating-and-stick-puck-drop-in-schedule.aspx',
    info: 'tol.ca (PerfectMind)',
  },
];

export function InfoBox() {
  const { scheduleIndex, allSessions } = useDataContext();
  const { sport } = useThemeContext();

  // Count sessions by city
  const cityCounts = allSessions.reduce((acc, session) => {
    const isOutdoor =
      session.facility.includes('Robson Square') ||
      session.facility.includes('Shipyards');
    const city = isOutdoor ? 'Outdoor' : session.city;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lastUpdated = scheduleIndex?.lastUpdated
    ? getRelativeTimeString(new Date(scheduleIndex.lastUpdated))
    : null;

  return (
    <Accordion
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
          Disclaimer & About
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Heads up!</strong> This site aggregates data from multiple sources.
            Schedules can change without notice. Always double-check with the official
            source before heading out!
          </Typography>
        </Alert>

        {scheduleIndex && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{scheduleIndex.totalSessions} sessions</strong> from{' '}
            {scheduleIndex.dateRange.start} to {scheduleIndex.dateRange.end}.
            <br />
            Last updated: {lastUpdated}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mb: 2 }}>
          Found a bug or have a feature request?{' '}
          <Link
            href="https://github.com/CoRfr/metro-vancouver-sports/issues"
            target="_blank"
            rel="noopener"
          >
            Report it on GitHub
          </Link>
        </Typography>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Data Sources
          </Typography>
          {dataSources.map((source) => (
            <Box
              key={source.city}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                mb: 1,
                fontSize: '0.875rem',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                {source.label}
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  minWidth: 50,
                }}
              >
                {cityCounts[source.city] ? `(${cityCounts[source.city]})` : ''}
              </Typography>
              <Typography component="span" color="text.secondary">
                <Link href={source.url} target="_blank" rel="noopener">
                  {source.info}
                </Link>
              </Typography>
            </Box>
          ))}
          {sport === 'skating' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                mb: 1,
                fontSize: '0.875rem',
              }}
            >
              <Typography component="span" sx={{ fontWeight: 600, minWidth: 120 }}>
                Outdoor Rinks
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  minWidth: 50,
                }}
              >
                {cityCounts['Outdoor'] ? `(${cityCounts['Outdoor']})` : ''}
              </Typography>
              <Typography component="span" color="text.secondary">
                <Link href="https://www.robsonsquare.com/" target="_blank" rel="noopener">
                  Robson Square
                </Link>
                ,{' '}
                <Link
                  href="https://www.cnv.org/parks-recreation/the-shipyards/skate-plaza"
                  target="_blank"
                  rel="noopener"
                >
                  The Shipyards
                </Link>
              </Typography>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
