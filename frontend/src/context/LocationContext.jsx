import { createContext, useContext, useState } from 'react';
const LocationContext = createContext(undefined);
const AVAILABLE_CITIES = [
  { id: 'all', label: 'All locations' },
  { id: 'Delhi NCR', label: 'Delhi NCR' },
  { id: 'Jaipur', label: 'Jaipur' },
];
export function LocationProvider({ children }) {
  const [selectedCity, setSelectedCityState] = useState(() => {
    try {
      return localStorage.getItem('vutto_selected_city') || 'all';
    } catch {
      return 'all';
    }
  });
  const setSelectedCity = (city) => {
    setSelectedCityState(city);
    try {
      localStorage.setItem('vutto_selected_city', city);
    } catch {
      // ignore
    }
  };
  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        availableCities: AVAILABLE_CITIES,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
export function useLocationFilter() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationFilter must be used within a LocationProvider');
  }
  return context;
}
