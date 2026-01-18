import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { UserLocation } from '../types';
import { getDefaultActivityTypes } from '../utils/filterUtils';
import { geocodePostalCode, reverseGeocode } from '../utils/mapUtils';
import { useThemeContext } from './ThemeContext';

interface FilterContextType {
  selectedCities: string[];
  selectedFacilities: string[];
  selectedActivityTypes: string[];
  distance: number;
  postalCode: string;
  userLocation: UserLocation | null;
  setSelectedCities: (cities: string[]) => void;
  setSelectedFacilities: (facilities: string[]) => void;
  setSelectedActivityTypes: (types: string[]) => void;
  setDistance: (distance: number) => void;
  setPostalCode: (code: string) => void;
  setUserLocation: (location: UserLocation | null) => void;
  handlePostalCodeChange: (code: string) => Promise<void>;
  useCurrentLocation: () => Promise<void>;
  resetFilters: () => void;
  isLocating: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = 'skatingScheduleSettings';

interface StoredSettings {
  postalCode?: string;
  userLocation?: UserLocation;
  cities?: string[];
  facilities?: string[];
  distance?: string;
  activityTypes?: Record<string, string[]>;
}

function getStoredSettings(): StoredSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not load settings:', e);
  }
  return {};
}

function saveSettings(updates: Record<string, unknown>) {
  try {
    const existing = getStoredSettings();
    const merged = { ...existing, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not save settings:', e);
  }
}

export function FilterContextProvider({ children }: { children: ReactNode }) {
  const { sport } = useThemeContext();

  const [selectedCities, setSelectedCitiesState] = useState<string[]>(() => {
    const settings = getStoredSettings();
    return settings.cities || [];
  });

  const [selectedFacilities, setSelectedFacilitiesState] = useState<string[]>(() => {
    const settings = getStoredSettings();
    return settings.facilities || [];
  });

  const [selectedActivityTypes, setSelectedActivityTypesState] = useState<string[]>(() => {
    const settings = getStoredSettings();
    const sportTypes = settings.activityTypes?.[sport];
    return sportTypes || getDefaultActivityTypes(sport);
  });

  const [distance, setDistanceState] = useState<number>(() => {
    const settings = getStoredSettings();
    return settings.distance ? parseInt(settings.distance, 10) : 10;
  });

  const [postalCode, setPostalCodeState] = useState<string>(() => {
    const settings = getStoredSettings();
    return settings.postalCode || '';
  });

  const [userLocation, setUserLocationState] = useState<UserLocation | null>(() => {
    const settings = getStoredSettings();
    return settings.userLocation || null;
  });

  const [isLocating, setIsLocating] = useState(false);

  // Update activity types when sport changes
  useEffect(() => {
    const settings = getStoredSettings();
    const sportTypes = settings.activityTypes?.[sport];
    if (sportTypes) {
      setSelectedActivityTypesState(sportTypes);
    } else {
      setSelectedActivityTypesState(getDefaultActivityTypes(sport));
    }
  }, [sport]);

  const setSelectedCities = useCallback((cities: string[]) => {
    setSelectedCitiesState(cities);
    saveSettings({ cities });
  }, []);

  const setSelectedFacilities = useCallback((facilities: string[]) => {
    setSelectedFacilitiesState(facilities);
    saveSettings({ facilities });
  }, []);

  const setSelectedActivityTypes = useCallback((types: string[]) => {
    setSelectedActivityTypesState(types);
    const settings = getStoredSettings();
    const existingActivityTypes = settings.activityTypes || {};
    saveSettings({
      activityTypes: {
        ...existingActivityTypes,
        [sport]: types,
      },
    });
  }, [sport]);

  const setDistance = useCallback((dist: number) => {
    setDistanceState(dist);
    saveSettings({ distance: dist.toString() });
  }, []);

  const setPostalCode = useCallback((code: string) => {
    setPostalCodeState(code);
    saveSettings({ postalCode: code });
  }, []);

  const setUserLocation = useCallback((location: UserLocation | null) => {
    setUserLocationState(location);
    saveSettings({ userLocation: location });
  }, []);

  const handlePostalCodeChange = useCallback(async (code: string) => {
    setPostalCode(code);

    if (!code.trim()) {
      setUserLocation(null);
      return;
    }

    const coords = await geocodePostalCode(code);
    if (coords) {
      setUserLocation(coords);
    } else {
      setUserLocation(null);
    }
  }, [setPostalCode, setUserLocation]);

  const useCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude: lat, longitude: lng } = position.coords;
      setUserLocation({ lat, lng });

      const postal = await reverseGeocode(lat, lng);
      if (postal) {
        setPostalCode(postal);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      alert('Unable to get your location. Please enter your postal code manually.');
    } finally {
      setIsLocating(false);
    }
  }, [setUserLocation, setPostalCode]);

  const resetFilters = useCallback(() => {
    setSelectedCities([]);
    setSelectedFacilities([]);
    setSelectedActivityTypes(getDefaultActivityTypes(sport));
    setDistance(10);
  }, [sport, setSelectedCities, setSelectedFacilities, setSelectedActivityTypes, setDistance]);

  const value = useMemo(
    () => ({
      selectedCities,
      selectedFacilities,
      selectedActivityTypes,
      distance,
      postalCode,
      userLocation,
      setSelectedCities,
      setSelectedFacilities,
      setSelectedActivityTypes,
      setDistance,
      setPostalCode,
      setUserLocation,
      handlePostalCodeChange,
      useCurrentLocation,
      resetFilters,
      isLocating,
    }),
    [
      selectedCities,
      selectedFacilities,
      selectedActivityTypes,
      distance,
      postalCode,
      userLocation,
      setSelectedCities,
      setSelectedFacilities,
      setSelectedActivityTypes,
      setDistance,
      setPostalCode,
      setUserLocation,
      handlePostalCodeChange,
      useCurrentLocation,
      resetFilters,
      isLocating,
    ]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterContextProvider');
  }
  return context;
}
