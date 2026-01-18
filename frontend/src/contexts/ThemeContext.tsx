import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, sportGradients } from '../theme/theme';
import { Sport } from '../types';

interface ThemeContextType {
  mode: PaletteMode;
  sport: Sport;
  toggleDarkMode: () => void;
  setSport: (sport: Sport) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'skatingScheduleSettings';

function getStoredSettings(): { darkMode?: boolean; darkModeExplicit?: boolean; currentSport?: Sport } {
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

function getDefaultDarkMode(): boolean {
  const settings = getStoredSettings();
  if (settings.darkModeExplicit) {
    return settings.darkMode ?? false;
  }
  // Time-based default: dark mode 8 PM (20:00) to 6 AM (06:00)
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() =>
    getDefaultDarkMode() ? 'dark' : 'light'
  );
  const [sport, setSportState] = useState<Sport>(() => {
    const settings = getStoredSettings();
    return settings.currentSport || 'skating';
  });
  const [darkModeExplicit, setDarkModeExplicit] = useState(() =>
    getStoredSettings().darkModeExplicit ?? false
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleDarkMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setDarkModeExplicit(true);
    saveSettings({ darkMode: newMode === 'dark', darkModeExplicit: true });
  };

  const setSport = (newSport: Sport) => {
    setSportState(newSport);
    saveSettings({ currentSport: newSport });
  };

  // Apply sport-specific background gradient to body
  useEffect(() => {
    const gradient = sportGradients[sport][mode];
    document.body.style.background = gradient;
    document.body.style.minHeight = '100vh';

    return () => {
      document.body.style.background = '';
    };
  }, [sport, mode]);

  const value = useMemo(
    () => ({
      mode,
      sport,
      toggleDarkMode,
      setSport,
      isDarkMode: mode === 'dark',
    }),
    [mode, sport, darkModeExplicit]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
}
