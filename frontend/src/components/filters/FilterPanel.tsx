import { Paper, Box, Grid } from '@mui/material';
import { SportSelector } from './SportSelector';
import { CityFilter } from './CityFilter';
import { FacilityFilter } from './FacilityFilter';
import { LocationInput } from './LocationInput';
import { DistanceFilter } from './DistanceFilter';
import { ActivityTypeFilter } from './ActivityTypeFilter';

export function FilterPanel() {
  return (
    <Paper
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 2,
      }}
    >
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={2}>
          <SportSelector />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <CityFilter />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FacilityFilter />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LocationInput />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <DistanceFilter />
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 2.5,
          pt: 2,
          pb: 0.5,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <ActivityTypeFilter />
      </Box>
    </Paper>
  );
}
