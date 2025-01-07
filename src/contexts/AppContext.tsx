import React, {useState, useMemo, useEffect, useContext} from 'react';
import {AppTabType} from '../types/Enums';
import Cookies from 'js-cookie';
import {useQuery} from '@tanstack/react-query';
import {userOptions} from '../hooks/dataOptions';
import {getUsernameFromId} from '../utils/dataSelectors';
import {useNotifications} from '../modules/notifications/NotificationContext';
import {UserIdSchema} from '../types/APIDataSchema';

export type OscarAppContextValue = Readonly<{
  selectedTab: AppTabType;
  setSelectedTab: (tab: AppTabType) => void;
  activeUserId: UserId | null;
  setActiveUserId: (id: UserId | null) => void;
  activeUsername: string | null;
  //setActiveUsername: (username: string | null) => void;
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
  props: Props,
): React.ReactElement {
  const [year, setYear] = useState<number>(2023);
  const [activeUserId, setActiveUserId] = useState<UserId | null>(null);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
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
      activeUsername,
      preferences,
      setPreferences,
      year,
      setYear,
    };
  }, [selectedTab, activeUserId, activeUsername, preferences, year]);

  return (
    <OscarAppContext.Provider value={contextValue}>
      <CookieHandler usernameSetter={setActiveUsername} />
      {props.children}
    </OscarAppContext.Provider>
  );
}

export function useOscarAppContext(): OscarAppContextValue {
  const value = useContext(OscarAppContext);
  if (value == null) {
    throw new Error(
      'Attempting to call useOscarAppContext outside of a OscarAppContextProvider',
    );
  }

  return value;
}

function CookieHandler({
  usernameSetter,
}: {
  usernameSetter: (username: string | null) => void;
}): React.ReactElement {
  const {activeUserId, setActiveUserId, activeUsername} = useOscarAppContext();
  const EXPIRATION_DAYS = 400;
  const [isInitialised, setIsInitialised] = useState(false);
  const userList = useQuery(userOptions());

  useEffect(() => {
    if (isInitialised) {
      Cookies.set('activeUserId', activeUserId as string, {
        expires: EXPIRATION_DAYS,
      });
      if (userList.data) {
        const newUsername = getUsernameFromId(
          activeUserId ?? '',
          userList.data,
        );
        Cookies.set('activeUsername', newUsername as string, {
          expires: EXPIRATION_DAYS,
        });
        usernameSetter(newUsername);
      } else {
        usernameSetter(null);
      }
    } else {
      setIsInitialised(true);
      const value: UserId | null = UserIdSchema.parse(
        Cookies.get('activeUserId'),
      );
      if (value) {
        setActiveUserId(value);
      } else {
        setActiveUserId(null);
      }
      const strValue: string | undefined = Cookies.get('activeUsername');
      if (userList.isSuccess) {
        usernameSetter(getUsernameFromId(activeUserId ?? '', userList.data));
      } else if (strValue === undefined) return;
      else {
        usernameSetter(strValue ?? null);
      }
    }
  }, [activeUserId]);

  userList.promise.then(data => {
    if (activeUsername !== getUsernameFromId(activeUserId ?? '', data)) {
      console.log(
        `The activeUsername ${activeUsername} doesn't match the activeUserId ${activeUserId}. Attempting to fix...`,
      );
      const notifications = useNotifications(null);
      notifications.show({
        type: 'error',
        message:
          'The username was incorrectly set. If it remains incorrect, reload the page.',
      });
      usernameSetter(getUsernameFromId(activeUserId ?? '', data));
    }
  });

  return <></>;
}
