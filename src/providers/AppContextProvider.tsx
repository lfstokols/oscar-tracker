import React, {useMemo} from 'react';

import AppContext from './AppContext';
import useActiveUserState from '../hooks/useActiveUserState';
import usePreferencesState from '../hooks/usePreferencesState';
import useYearState from '../hooks/useYearState';

type Props = {
  children: React.ReactElement;
};

export default function AppContextProvider({
  children,
}: Props): React.ReactElement {
  const [activeUserId, activeUsername, setActiveUserId] = useActiveUserState();
  const [preferences, setPreferences] = usePreferencesState();
  const [year, setYear] = useYearState();

  const contextValue = useMemo(() => {
    return {
      activeUserId,
      activeUsername,
      setActiveUserId, //* This one sets the username and cookies too
      preferences,
      setPreferences, //* This one updates the localStorage too
      year,
      setYear, //* This one updates the URL too
    };
  }, [
    activeUserId,
    activeUsername,
    setActiveUserId,
    setPreferences,
    setYear,
    preferences,
    year,
  ]);

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
