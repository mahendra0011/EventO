import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { findCityOption } from '../data/indianCities';

const CityContext = createContext(null);
const CITY_STORAGE_KEY = 'evento-selected-city';

const getStoredCity = () => {
  if (typeof window === 'undefined') return null;

  try {
    const storedCity = window.localStorage.getItem(CITY_STORAGE_KEY);
    if (!storedCity) return null;

    const parsed = JSON.parse(storedCity);
    return findCityOption(parsed.city, parsed.state) || null;
  } catch (error) {
    console.error('Unable to read city preference:', error);
    return null;
  }
};

export const CityProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(getStoredCity);

  useEffect(() => {
    try {
      if (selectedCity) {
        window.localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify({
          city: selectedCity.city,
          state: selectedCity.state
        }));
      } else {
        window.localStorage.removeItem(CITY_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Unable to save city preference:', error);
    }
  }, [selectedCity]);

  const value = useMemo(() => ({
    selectedCity,
    selectCity: setSelectedCity,
    clearCity: () => setSelectedCity(null)
  }), [selectedCity]);

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);

  if (!context) {
    throw new Error('useCity must be used inside CityProvider');
  }

  return context;
};
