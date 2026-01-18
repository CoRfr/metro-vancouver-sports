import { useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Checkbox,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useFilterContext, useDataContext } from '../../contexts';
import { shortFacilityName, getCityAbbr } from '../../utils/filterUtils';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface FacilityOption {
  name: string;
  city: string;
  distance?: number;
}

export function FacilityFilter() {
  const { selectedFacilities, setSelectedFacilities, userLocation } = useFilterContext();
  const { allSessions } = useDataContext();

  // Build facility options from sessions
  const facilityOptions = useMemo(() => {
    const facilitiesMap = new Map<string, FacilityOption>();

    allSessions.forEach((s) => {
      if (!facilitiesMap.has(s.facility)) {
        facilitiesMap.set(s.facility, {
          name: s.facility,
          city: s.city,
          distance: undefined,
        });
      }
    });

    let facilities = Array.from(facilitiesMap.values());

    // Sort by distance if user location is available
    if (userLocation) {
      facilities = facilities.sort((a, b) => {
        const sessionA = allSessions.find((s) => s.facility === a.name);
        const sessionB = allSessions.find((s) => s.facility === b.name);
        if (!sessionA || !sessionB) return 0;

        const R = 6371;
        const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const distA = calcDist(userLocation.lat, userLocation.lng, sessionA.lat, sessionA.lng);
        const distB = calcDist(userLocation.lat, userLocation.lng, sessionB.lat, sessionB.lng);

        a.distance = distA;
        b.distance = distB;

        return distA - distB;
      });
    } else {
      facilities.sort((a, b) => a.name.localeCompare(b.name));
    }

    return facilities;
  }, [allSessions, userLocation]);

  const selectedOptions = facilityOptions.filter((f) =>
    selectedFacilities.includes(f.name)
  );

  const handleChange = (_: unknown, newValue: FacilityOption[]) => {
    setSelectedFacilities(newValue.map((f) => f.name));
  };

  return (
    <Autocomplete
      multiple
      size="small"
      id="facility-filter"
      options={facilityOptions}
      value={selectedOptions}
      onChange={handleChange}
      disableCloseOnSelect
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.name === value.name}
      renderOption={(props, option, { selected }) => (
        <Box component="li" {...props} key={option.name}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={selected}
            size="small"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {shortFacilityName(option.name)}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              bgcolor: 'action.hover',
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              color: 'text.secondary',
            }}
          >
            {getCityAbbr(option.city)}
          </Typography>
          {option.distance !== undefined && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {option.distance.toFixed(1)} km
            </Typography>
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Facility"
          placeholder={selectedFacilities.length === 0 ? 'All Facilities' : ''}
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.length <= 2 ? (
          tagValue.map((option, index) => (
            <Chip
              label={shortFacilityName(option.name)}
              size="small"
              {...getTagProps({ index })}
              key={option.name}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            {tagValue.length} selected
          </Typography>
        )
      }
    />
  );
}
