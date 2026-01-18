import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { useFilterContext } from '../../contexts';
import { ALL_CITIES } from '../../types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP,
    },
  },
};

export function CityFilter() {
  const { selectedCities, setSelectedCities } = useFilterContext();

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedCities(typeof value === 'string' ? value.split(',') : value);
  };

  const displayValue =
    selectedCities.length === 0
      ? 'All Cities'
      : selectedCities.length === 1
      ? selectedCities[0]
      : `${selectedCities.length} selected`;

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="city-filter-label">City</InputLabel>
      <Select
        labelId="city-filter-label"
        id="city-filter"
        multiple
        value={selectedCities}
        onChange={handleChange}
        input={<OutlinedInput label="City" />}
        renderValue={() => displayValue}
        MenuProps={MenuProps}
      >
        {ALL_CITIES.map((city) => (
          <MenuItem key={city} value={city} dense>
            <Checkbox checked={selectedCities.includes(city)} size="small" />
            <ListItemText primary={city} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
