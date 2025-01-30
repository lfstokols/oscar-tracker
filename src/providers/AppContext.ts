import * as React from 'react';
import {useContext} from 'react';

export type AppContextValue = Readonly<{
  // selectedTab: AppTabType;
  // setSelectedTab: (tab: AppTabType) => void;
  activeUserId: UserId | null;
  activeUsername: string | null;
  setActiveUserId: (id: UserId | null) => void;
  preferences: Preferences;
  setPreferences: (pref: Preferences) => void;
  year: number;
  setYear: (year: number) => void;
}>;

const AppContext = React.createContext<AppContextValue | null>(null);

export function useOscarAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (value == null) {
    throw new Error(
      'Attempting to call useOscarAppContext outside of a OscarAppContextProvider',
    );
  }

  return value;
}

export default AppContext;
