import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  ThemeContextProvider,
  FilterContextProvider,
  DataContextProvider,
  UIContextProvider,
} from './contexts';

// Global styles for Leaflet marker animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-marker {
    from { transform: scale(1); }
    to { transform: scale(1.3); }
  }
  .map-marker-highlighted {
    animation: pulse-marker 0.5s ease-in-out infinite alternate;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider>
      <FilterContextProvider>
        <DataContextProvider>
          <UIContextProvider>
            <App />
          </UIContextProvider>
        </DataContextProvider>
      </FilterContextProvider>
    </ThemeContextProvider>
  </React.StrictMode>
);
