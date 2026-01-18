import { Fab, Box } from '@mui/material';
import { useThemeContext } from '../../contexts';

export function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useThemeContext();

  return (
    <Fab
      size="medium"
      onClick={toggleDarkMode}
      title="Toggle dark mode"
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: 'divider',
        boxShadow: 3,
        '&:hover': {
          bgcolor: 'background.paper',
          transform: 'scale(1.1)',
        },
        transition: 'transform 0.2s',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="span"
          sx={{
            position: 'absolute',
            fontSize: '1.3rem',
            lineHeight: 1,
            opacity: isDarkMode ? 1 : 0,
            transform: isDarkMode ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'opacity 0.3s, transform 0.3s',
          }}
        >
          ☀️
        </Box>
        <Box
          component="span"
          sx={{
            position: 'absolute',
            fontSize: '1.3rem',
            lineHeight: 1,
            opacity: isDarkMode ? 0 : 1,
            transform: isDarkMode ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'opacity 0.3s, transform 0.3s',
          }}
        >
          🌙
        </Box>
      </Box>
    </Fab>
  );
}
