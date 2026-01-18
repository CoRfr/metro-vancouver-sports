import { AppLayout, Header, InfoBox } from './components/layout';
import { FilterPanel } from './components/filters';
import { CalendarContainer } from './components/calendar';
import { MapPanel } from './components/map';
import { SessionModal } from './components/modal';
import { DarkModeToggle } from './components/common';

function App() {
  return (
    <AppLayout>
      <Header />
      <InfoBox />
      <FilterPanel />
      <MapPanel />
      <CalendarContainer />
      <SessionModal />
      <DarkModeToggle />
    </AppLayout>
  );
}

export default App;
