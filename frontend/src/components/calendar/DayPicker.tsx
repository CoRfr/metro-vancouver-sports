import React from 'react';
import { Box, Button, IconButton, TextField, Stack } from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useDataContext } from '../../contexts';
import { getDayPickerDates, formatDateStr, isToday, isWeekend } from '../../utils/dateUtils';
import { format, addDays } from 'date-fns';

export function DayPicker() {
  const { currentDate, setCurrentDate } = useDataContext();

  const days = getDayPickerDates(currentDate);

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value + 'T00:00:00');
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
        mb: 2,
      }}
    >
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="small"
          onClick={() => setCurrentDate(addDays(currentDate, -7))}
          title="Previous week"
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          <KeyboardDoubleArrowLeftIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setCurrentDate(addDays(currentDate, -1))}
          title="Previous day"
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          bgcolor: 'action.hover',
          p: 0.5,
          borderRadius: 2,
        }}
      >
        {days.map((date, index) => {
          const isSelected = index === 1; // Middle day (index 1 = offset 0)
          const isTodayDate = isToday(date);
          const isWeekendDate = isWeekend(date);

          return (
            <Button
              key={formatDateStr(date)}
              onClick={() => handleDayClick(date)}
              sx={{
                minWidth: { xs: 44, sm: 70 },
                px: { xs: 0.5, sm: 1.5 },
                py: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                bgcolor: isSelected
                  ? isTodayDate
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'background.paper'
                  : isWeekendDate
                  ? 'rgba(102, 126, 234, 0.08)'
                  : 'transparent',
                background: isSelected && isTodayDate
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : undefined,
                border: isTodayDate && !isSelected ? 2 : 0,
                borderColor: 'primary.main',
                boxShadow: isSelected ? 1 : 0,
                '&:hover': {
                  bgcolor: isSelected ? 'background.paper' : 'action.hover',
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                  textTransform: 'uppercase',
                  color: isSelected && isTodayDate
                    ? 'white'
                    : isTodayDate || isWeekendDate
                    ? 'primary.main'
                    : 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {format(date, 'EEE')}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '1.1rem' },
                  fontWeight: 700,
                  color: isSelected && isTodayDate ? 'white' : 'text.primary',
                }}
              >
                {format(date, 'd')}
              </Box>
            </Button>
          );
        })}
      </Box>

      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="small"
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          title="Next day"
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setCurrentDate(addDays(currentDate, 7))}
          title="Next week"
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          <KeyboardDoubleArrowRightIcon fontSize="small" />
        </IconButton>
      </Stack>

      <TextField
        type="date"
        size="small"
        value={formatDateStr(currentDate)}
        onChange={handleDateChange}
        sx={{
          '& input': {
            cursor: 'pointer',
            py: 1,
            px: 1.5,
          },
        }}
      />
    </Box>
  );
}
