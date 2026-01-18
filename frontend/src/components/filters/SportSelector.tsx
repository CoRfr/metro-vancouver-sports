import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Box,
  SelectChangeEvent,
} from '@mui/material';
import { useThemeContext } from '../../contexts';
import { Sport, SPORTS_CONFIG } from '../../types';

export function SportSelector() {
  const { sport, setSport } = useThemeContext();

  const handleChange = (event: SelectChangeEvent<Sport>) => {
    setSport(event.target.value as Sport);
  };

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="sport-select-label">Sport</InputLabel>
      <Select
        labelId="sport-select-label"
        id="sport-select"
        value={sport}
        label="Sport"
        onChange={handleChange}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ filter: 'grayscale(100%)', opacity: 0.8 }}>
              {value === 'skating' ? '⛸️' : '🏊'}
            </span>
            <span>{SPORTS_CONFIG[value].name}</span>
          </Box>
        )}
      >
        <MenuItem value="skating">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>⛸️</span>
            <span>Ice Skating</span>
          </Box>
        </MenuItem>
        <MenuItem value="swimming">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>🏊</span>
            <span>Swimming</span>
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
}
