import { createTheme, ThemeOptions, PaletteMode } from '@mui/material';

// Activity type colors for skating
export const skatingActivityColors = {
  public: { main: '#1976d2', light: '#e3f2fd', dark: '#1a3a5c', border: '#90caf9' },
  family: { main: '#7b1fa2', light: '#f3e5f5', dark: '#3d1a4a', border: '#ce93d8' },
  hockey: { main: '#ef6c00', light: '#fff3e0', dark: '#4a2800', border: '#ffb74d' },
  figure: { main: '#c2185b', light: '#fce4ec', dark: '#4a1a2e', border: '#f48fb1' },
  discount: { main: '#388e3c', light: '#e8f5e9', dark: '#1a3d1c', border: '#81c784' },
};

// Activity type colors for swimming
export const swimmingActivityColors = {
  publicSwim: { main: '#0097a7', light: '#e0f7fa', dark: '#003d44', border: '#80deea' },
  lapSwim: { main: '#3949ab', light: '#e8eaf6', dark: '#1a2352', border: '#9fa8da' },
  familySwim: { main: '#7b1fa2', light: '#f3e5f5', dark: '#3d1a4a', border: '#ce93d8' },
  adultSwim: { main: '#ffa000', light: '#fff8e1', dark: '#4a3000', border: '#ffe082' },
  aquafit: { main: '#43a047', light: '#e8f5e9', dark: '#1a3d1c', border: '#a5d6a7' },
  swimLessons: { main: '#ec407a', light: '#fce4ec', dark: '#4a1a2e', border: '#f48fb1' },
};

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#667eea',
      light: '#8a9bef',
      dark: '#4a5cb8',
    },
    secondary: {
      main: '#764ba2',
      light: '#9a6fc4',
      dark: '#5a3580',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: mode === 'light' ? '#333333' : '#e0e0e0',
      secondary: mode === 'light' ? '#555555' : '#c0c0c0',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.3rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));

// Sport-specific background gradients
export const sportGradients = {
  skating: {
    light: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 50%, #dfe6e9 100%)',
    dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  swimming: {
    light: 'linear-gradient(135deg, #00cec9 0%, #0984e3 50%, #6c5ce7 100%)',
    dark: 'linear-gradient(135deg, #0d2137 0%, #0a3d62 50%, #1e3a5f 100%)',
  },
};

// Get activity color by type
export const getActivityColor = (
  type: string,
  sport: 'skating' | 'swimming',
  isDiscount: boolean = false,
  mode: PaletteMode = 'light'
): { main: string; bg: string; border: string } => {
  let colors;

  if (sport === 'skating') {
    if (isDiscount) {
      colors = skatingActivityColors.discount;
    } else {
      switch (type) {
        case 'Public Skating':
          colors = skatingActivityColors.public;
          break;
        case 'Family Skate':
          colors = skatingActivityColors.family;
          break;
        case 'Family Hockey':
        case 'Drop-in Hockey':
        case 'Hockey':
          colors = skatingActivityColors.hockey;
          break;
        case 'Figure Skating':
          colors = skatingActivityColors.figure;
          break;
        default:
          colors = skatingActivityColors.public;
      }
    }
  } else {
    switch (type) {
      case 'Public Swim':
        colors = swimmingActivityColors.publicSwim;
        break;
      case 'Lap Swim':
        colors = swimmingActivityColors.lapSwim;
        break;
      case 'Family Swim':
        colors = swimmingActivityColors.familySwim;
        break;
      case 'Adult Swim':
        colors = swimmingActivityColors.adultSwim;
        break;
      case 'Aquafit':
        colors = swimmingActivityColors.aquafit;
        break;
      case 'Lessons':
        colors = swimmingActivityColors.swimLessons;
        break;
      default:
        colors = swimmingActivityColors.publicSwim;
    }
  }

  return {
    main: colors.main,
    bg: mode === 'dark' ? colors.dark : colors.light,
    border: colors.border,
  };
};
