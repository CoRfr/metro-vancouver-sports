import { Paper } from '@mui/material';
import { useDataContext } from '../../contexts';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function CalendarContainer() {
  const { viewMode, isLoading } = useDataContext();

  const renderView = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    switch (viewMode) {
      case 'day':
        return <DayView />;
      case 'week':
        return <WeekView />;
      case 'month':
        return <MonthView />;
      default:
        return <DayView />;
    }
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        mb: 3,
      }}
    >
      <CalendarHeader />
      {renderView()}
    </Paper>
  );
}
