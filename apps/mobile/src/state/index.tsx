import React, { createContext, useContext, useState } from 'react';
import { LocationState, createLocationState } from '@sunscope/core';

export type AppTab = 'Now' | 'Day' | 'Place';
export type AppMode = 'live' | 'scrubbed';

export interface AppStateValue {
  activeTab: AppTab;
  currentLocation: LocationState;
  selectedDate: Date;
  mode: AppMode;
  shadowOpen: boolean;
  debugVisible: boolean;
  setActiveTab: (tab: AppTab) => void;
  setCurrentLocation: (location: LocationState) => void;
  setSelectedDate: (date: Date) => void;
  setMode: (mode: AppMode) => void;
  setShadowOpen: (open: boolean) => void;
  setDebugVisible: (visible: boolean) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider(props: { children: React.ReactNode }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('Now');
  const [currentLocation, setCurrentLocation] = useState<LocationState>(createLocationState());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-03-16T00:00:00Z'));
  const [mode, setMode] = useState<AppMode>('live');
  const [shadowOpen, setShadowOpen] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  return (
    <AppStateContext.Provider
      value={{
        activeTab,
        currentLocation,
        selectedDate,
        mode,
        shadowOpen,
        debugVisible,
        setActiveTab,
        setCurrentLocation,
        setSelectedDate,
        setMode,
        setShadowOpen,
        setDebugVisible
      }}
    >
      {props.children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (value === null) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return value;
}
