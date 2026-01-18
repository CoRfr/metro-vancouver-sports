import { useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useFilterContext, useThemeContext } from '../../contexts';
import { SPORTS_CONFIG } from '../../types';

export function ActivityTypeFilter() {
  const { selectedActivityTypes, setSelectedActivityTypes } = useFilterContext();
  const { sport } = useThemeContext();

  const activityTypes = useMemo(() => {
    return SPORTS_CONFIG[sport].activityTypes.filter((t) => !t.isAll);
  }, [sport]);

  const allChecked = activityTypes.every((t) =>
    selectedActivityTypes.includes(t.value)
  );

  const handleToggleAll = () => {
    if (allChecked) {
      setSelectedActivityTypes([]);
    } else {
      setSelectedActivityTypes(activityTypes.map((t) => t.value));
    }
  };

  const handleToggle = (value: string) => {
    if (selectedActivityTypes.includes(value)) {
      setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== value));
    } else {
      setSelectedActivityTypes([...selectedActivityTypes, value]);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', py: 0.5 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.75rem',
          mr: 1,
        }}
      >
        Activity Types:
      </Typography>

      <Chip
        label="All"
        size="small"
        onClick={handleToggleAll}
        icon={allChecked ? <CheckIcon /> : undefined}
        sx={{
          fontWeight: 600,
          bgcolor: allChecked
            ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
            : 'grey.800',
          color: 'white',
          background: allChecked
            ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
            : undefined,
          '&:hover': {
            bgcolor: allChecked ? '#0f8a80' : 'grey.700',
          },
        }}
      />

      {activityTypes.map((type) => {
        const isSelected = selectedActivityTypes.includes(type.value);
        return (
          <Chip
            key={type.id}
            label={type.label}
            size="small"
            onClick={() => handleToggle(type.value)}
            icon={isSelected ? <CheckIcon /> : undefined}
            sx={{
              fontWeight: 500,
              ...(isSelected && {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '& .MuiChip-icon': {
                  color: 'white',
                },
              }),
            }}
          />
        );
      })}
    </Box>
  );
}
