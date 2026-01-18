import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useFilterContext } from '../../contexts';

const distanceOptions = [
  { value: 999, label: 'Any Distance' },
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
];

export function DistanceFilter() {
  const { distance, setDistance } = useFilterContext();

  const handleChange = (event: SelectChangeEvent<number>) => {
    setDistance(event.target.value as number);
  };

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="distance-filter-label">Distance</InputLabel>
      <Select
        labelId="distance-filter-label"
        id="distance-filter"
        value={distance}
        label="Distance"
        onChange={handleChange}
      >
        {distanceOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
