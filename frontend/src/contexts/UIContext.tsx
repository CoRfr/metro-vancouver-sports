import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Session } from '../types';

interface UIContextType {
  selectedSession: Session | null;
  isSessionModalOpen: boolean;
  highlightedFacility: string | null;
  isMapPanelOpen: boolean;
  openSessionModal: (session: Session) => void;
  closeSessionModal: () => void;
  setHighlightedFacility: (facilityKey: string | null) => void;
  toggleMapPanel: () => void;
  setMapPanelOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIContextProvider({ children }: { children: ReactNode }) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [highlightedFacility, setHighlightedFacilityState] = useState<string | null>(null);
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false);

  const openSessionModal = useCallback((session: Session) => {
    setSelectedSession(session);
    setIsSessionModalOpen(true);
  }, []);

  const closeSessionModal = useCallback(() => {
    setIsSessionModalOpen(false);
    setSelectedSession(null);
  }, []);

  const setHighlightedFacility = useCallback((facilityKey: string | null) => {
    setHighlightedFacilityState(facilityKey);
  }, []);

  const toggleMapPanel = useCallback(() => {
    setIsMapPanelOpen((prev) => !prev);
  }, []);

  const setMapPanelOpen = useCallback((open: boolean) => {
    setIsMapPanelOpen(open);
  }, []);

  const value = useMemo(
    () => ({
      selectedSession,
      isSessionModalOpen,
      highlightedFacility,
      isMapPanelOpen,
      openSessionModal,
      closeSessionModal,
      setHighlightedFacility,
      toggleMapPanel,
      setMapPanelOpen,
    }),
    [
      selectedSession,
      isSessionModalOpen,
      highlightedFacility,
      isMapPanelOpen,
      openSessionModal,
      closeSessionModal,
      setHighlightedFacility,
      toggleMapPanel,
      setMapPanelOpen,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIContextProvider');
  }
  return context;
}
