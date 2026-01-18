import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Session, ScheduleIndex, Sport, SPORTS_CONFIG, ViewMode, Facility } from '../types';
import { useThemeContext } from './ThemeContext';
import { useFilterContext } from './FilterContext';
import { filterSessions } from '../utils/filterUtils';
import { getDatesForDayView, getDatesForWeekView, getDatesForMonthView, getDefaultDate } from '../utils/dateUtils';
import { calculateDistance } from '../utils/mapUtils';

interface DataContextType {
  allSessions: Session[];
  filteredSessions: Session[];
  facilities: Facility[];
  scheduleIndex: ScheduleIndex | null;
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  viewMode: ViewMode;
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Use Vite's base URL for proper path resolution in both dev and production
const SCHEDULES_BASE = `${import.meta.env.BASE_URL}data/schedules`;

function getSportFilename(sport: Sport): string {
  const config = SPORTS_CONFIG[sport];
  return config.dataFile.replace('.json', '');
}

export function DataContextProvider({ children }: { children: ReactNode }) {
  const { sport } = useThemeContext();
  const {
    selectedCities,
    selectedFacilities,
    selectedActivityTypes,
    distance,
    userLocation,
  } = useFilterContext();

  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [scheduleIndex, setScheduleIndex] = useState<ScheduleIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDateState] = useState<Date>(getDefaultDate);
  const [viewMode, setViewModeState] = useState<ViewMode>('day');
  const [loadedDays, setLoadedDays] = useState<Map<string, Session[]>>(new Map());

  // Get dates needed for current view
  const getDatesForView = useCallback((): string[] => {
    switch (viewMode) {
      case 'day':
        return getDatesForDayView(currentDate);
      case 'week':
        return getDatesForWeekView(currentDate);
      case 'month':
        return getDatesForMonthView(currentDate);
      default:
        return getDatesForDayView(currentDate);
    }
  }, [currentDate, viewMode]);

  // Load schedule index
  const loadScheduleIndex = useCallback(async () => {
    const sportFile = getSportFilename(sport);
    const response = await fetch(
      `${SCHEDULES_BASE}/index-${sportFile}.json`
    );
    if (!response.ok) {
      throw new Error(`Failed to load index: ${response.status}`);
    }
    return (await response.json()) as ScheduleIndex;
  }, [sport]);

  // Load a single day's schedule (returns sessions and cache update info)
  const loadDay = useCallback(
    async (dateStr: string, currentCache: Map<string, Session[]>): Promise<{ sessions: Session[]; cacheKey: string; fromCache: boolean }> => {
      const cacheKey = `${sport}:${dateStr}`;

      if (currentCache.has(cacheKey)) {
        return { sessions: currentCache.get(cacheKey)!, cacheKey, fromCache: true };
      }

      const [year, month, day] = dateStr.split('-');
      const sportFile = getSportFilename(sport);
      const url = `${SCHEDULES_BASE}/${year}/${month}/${day}/${sportFile}.json`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          return { sessions: [], cacheKey, fromCache: false };
        }
        const data = await response.json();
        const sessions = data.sessions || [];
        return { sessions, cacheKey, fromCache: false };
      } catch (e) {
        console.warn(`Could not load ${dateStr}:`, e);
        return { sessions: [], cacheKey, fromCache: false };
      }
    },
    [sport]
  );

  // Load multiple days in parallel and update cache
  const loadDays = useCallback(
    async (dateStrings: string[], currentCache: Map<string, Session[]>): Promise<{ sessions: Session[]; newCache: Map<string, Session[]> }> => {
      const promises = dateStrings.map((d) => loadDay(d, currentCache));
      const results = await Promise.all(promises);

      const newCache = new Map(currentCache);
      const allSessions: Session[] = [];

      for (const result of results) {
        allSessions.push(...result.sessions);
        if (!result.fromCache) {
          newCache.set(result.cacheKey, result.sessions);
        }
      }

      return { sessions: allSessions, newCache };
    },
    [loadDay]
  );

  // Initial data load
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const index = await loadScheduleIndex();
      setScheduleIndex(index);

      const datesToLoad = getDatesForView();
      const emptyCache = new Map<string, Session[]>();
      const { sessions, newCache } = await loadDays(datesToLoad, emptyCache);

      setLoadedDays(newCache);
      setAllSessions(sessions);
    } catch (e) {
      console.error('Error fetching data:', e);
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [loadScheduleIndex, getDatesForView, loadDays]);

  // Load data for view when navigating
  const loadDataForView = useCallback(async () => {
    const datesToLoad = getDatesForView();
    const { sessions, newCache } = await loadDays(datesToLoad, loadedDays);

    setLoadedDays(newCache);
    setAllSessions(sessions);
  }, [getDatesForView, loadedDays, loadDays]);

  // Load data when sport changes
  useEffect(() => {
    setLoadedDays(new Map());
    loadData();
  }, [sport]);

  // Load data when view/date changes
  useEffect(() => {
    if (scheduleIndex) {
      loadDataForView();
    }
  }, [currentDate, viewMode]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return filterSessions(
      allSessions,
      selectedCities,
      selectedFacilities,
      selectedActivityTypes,
      distance,
      userLocation,
      sport
    );
  }, [
    allSessions,
    selectedCities,
    selectedFacilities,
    selectedActivityTypes,
    distance,
    userLocation,
    sport,
  ]);

  // Build facilities list with distances
  const facilities = useMemo(() => {
    const facilityMap = new Map<string, Facility>();

    filteredSessions.forEach((session) => {
      const key = `${session.facility}-${session.lat}-${session.lng}`;
      if (!facilityMap.has(key)) {
        facilityMap.set(key, {
          name: session.facility,
          city: session.city,
          address: session.address,
          lat: session.lat,
          lng: session.lng,
          sessions: [],
          distance: userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, session.lat, session.lng)
            : undefined,
        });
      }
      facilityMap.get(key)!.sessions.push(session);
    });

    return Array.from(facilityMap.values()).sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return a.city.localeCompare(b.city) || a.name.localeCompare(b.name);
    });
  }, [filteredSessions, userLocation]);

  const setCurrentDate = useCallback((date: Date) => {
    setCurrentDateState(date);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const refreshData = useCallback(async () => {
    setLoadedDays(new Map());
    await loadData();
  }, [loadData]);

  const value = useMemo(
    () => ({
      allSessions,
      filteredSessions,
      facilities,
      scheduleIndex,
      isLoading,
      error,
      currentDate,
      viewMode,
      setCurrentDate,
      setViewMode,
      refreshData,
    }),
    [
      allSessions,
      filteredSessions,
      facilities,
      scheduleIndex,
      isLoading,
      error,
      currentDate,
      viewMode,
      setCurrentDate,
      setViewMode,
      refreshData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataContextProvider');
  }
  return context;
}
