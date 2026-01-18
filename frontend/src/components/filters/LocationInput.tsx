import { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useFilterContext } from '../../contexts';

export function LocationInput() {
  const { postalCode, handlePostalCodeChange, useCurrentLocation, isLocating } =
    useFilterContext();
  const [inputValue, setInputValue] = useState(postalCode);

  useEffect(() => {
    setInputValue(postalCode);
  }, [postalCode]);

  // Debounce postal code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== postalCode) {
        handlePostalCodeChange(inputValue);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputValue, postalCode, handlePostalCodeChange]);

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        size="small"
        label="Location"
        placeholder="Postal code"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        sx={{ flex: 1 }}
      />
      <Button
        variant="contained"
        onClick={useCurrentLocation}
        disabled={isLocating}
        sx={{
          minWidth: 'auto',
          px: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4192 100%)',
          },
        }}
      >
        {isLocating ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <MyLocationIcon />
        )}
      </Button>
    </Box>
  );
}
