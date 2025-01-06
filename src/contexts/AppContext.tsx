import React, { useState, useMemo, useEffect, useContext } from 'react';
import { AppTabType } from '../types/Enums';
import Cookies from 'js-cookie';

export type OscarAppContextValue = Readonly<{
  selectedTab: AppTabType;
  setSelectedTab: (tab: AppTabType) => void;
  activeUserId: string | null;
  setActiveUserId: (username: string | null) => void;
  preferences: Preferences;
  setPreferences: (pref: Preferences) => void;
  year: number;
  setYear: (year: number) => void;
}>;

const OscarAppContext = React.createContext<OscarAppContextValue | null>(null);

type Props = {
  children: React.ReactElement;
};

export default function OscarAppContextProvider(
  props: Props
): React.ReactElement {
  const [year, setYear] = useState<number>(2023);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<AppTabType>(AppTabType.legacy);
  const [preferences, setPreferences] = useState<Preferences>({
    shortsAreOneFilm: true,
    highlightAnimated: true,
  });

  const contextValue = useMemo(() => {
    return {
      selectedTab,
      setSelectedTab,
      activeUserId,
      setActiveUserId,
      preferences,
      setPreferences,
      year,
      setYear,
    };
  }, [
    selectedTab,
    activeUserId,
    preferences,
    year,
  ]);

  return (
    <OscarAppContext.Provider value={contextValue}>
      <CookieHandler />
      {props.children}
    </OscarAppContext.Provider>
  );
}

export function useOscarAppContext(): OscarAppContextValue {
  const value = useContext(OscarAppContext);
  if (value == null) {
    throw new Error(
      'Attempting to call useOscarAppContext outside of a OscarAppContextProvider'
    );
  }

  return value;
}


function CookieHandler(): React.ReactElement {
  const { activeUserId, setActiveUserId } = useOscarAppContext();
  const EXPIRATION_DAYS = 400;
  const [isInitialised, setIsInitialised] = useState(false);

  useEffect(() => {
    if (isInitialised) {
      Cookies.set('activeUserId', activeUserId as string, {
        expires: EXPIRATION_DAYS,
      });
    } else {
      setIsInitialised(true);
      const value: string | undefined = Cookies.get('activeUserId');
      if (value && value.startsWith('usr_')) {
        setActiveUserId(value);
      } else {
        setActiveUserId(null);
      }
    }
  }, [activeUserId]);
  //useEffect(() => {Cookies.set('activeUserId', activeUserId, {expires: EXPIRATION_DAYS})}, [activeUserId]);
  return <></>;
}
