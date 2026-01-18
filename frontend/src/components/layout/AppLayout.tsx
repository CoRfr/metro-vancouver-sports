import { ReactNode } from 'react';
import { Container, Box } from '@mui/material';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 1, sm: 2.5 },
        px: { xs: 1, sm: 2.5 },
      }}
    >
      <Container maxWidth="lg" disableGutters>
        {children}
      </Container>
    </Box>
  );
}
