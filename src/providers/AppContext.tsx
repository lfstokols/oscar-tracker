import React, {useState, useMemo, useContext} from 'react';
import Cookies from 'js-cookie';
import {QueryClient, useQueryClient} from '@tanstack/react-query';
import {userOptions} from '../hooks/dataOptions';
import {getUsernameFromId} from '../utils/dataSelectors';
import {useNotifications, NotificationsDispatch} from './NotificationContext';
import {UserIdSchema} from '../types/APIDataSchema';
import {UrlParamsContext} from './RouteParser';
import {
  DEFAULT_YEAR,
  EXPIRATION_DAYS,
  DEFAULT_PREFERENCES,
  AVAILABLE_YEARS,
} from '../config/GlobalConstants';
import {warnToConsole} from '../utils/Logger';
import {useNavigate} from 'react-router-dom';

export type OscarAppContextValue = Readonly<{
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

const OscarAppContext = React.createContext<OscarAppContextValue | null>(null);

type Props = {
  children: React.ReactElement;
};

export default function OscarAppContextProvider(
  props: Props,
): React.ReactElement {
  const navigate = useNavigate();
  const urlParams = useContext(UrlParamsContext);
  const [year, setYear] = useState<number>(() => {
    const urlYear = urlParams?.year ?? null;
    if (urlYear && AVAILABLE_YEARS.includes(urlYear)) {
      return urlYear;
    }
    return DEFAULT_YEAR;
  });
  const [preferences, setPreferences] = useState<Preferences>(
    getPreferenceStateAtStartup(DEFAULT_PREFERENCES),
  );

  //* The username and userId need special handling, since they're set from cookies
  //* Eventually the preferences will also be defaulted from pulled data
  //*   so they'll need the queryClient too. But at least the preferences don't need
  //*   to be set from two separate sources validated at runtime.
  //* The year is set from the URL, but it's defaulted from a config file so just need
  //*   to update the URL when it changes.
  //*   Specifically, the only way the year can change is by using the YearSelector,
  //*   which is fixed by the usual trick of modifying setYear, or by typing in
  //*   a specific year in the URL, which is handled by the useParams up above
  //*   when we set the default in useState.
  // TODO - Wait, can I just use TanStack to set the username and userId? It's fundamentally a cache thing, no? Hmm...
  const queryClient = useQueryClient();
  //* Set the default values from the cookies
  const parsed = UserIdSchema.safeParse(Cookies.get('activeUserId'));
  const defaultUserId = parsed.success ? parsed.data : null;
  const defaultUsername = Cookies.get('activeUsername') ?? null;
  //* Set the state variables with cookie values
  const [activeUserId, setActiveUserId] = useState<UserId | null>(
    defaultUserId,
  );
  const [activeUsername, setActiveUsername] = useState<string | null>(
    defaultUsername,
  );
  //* Set a promise to check the username and userId are consistent with each other
  const timeStamp = Date.now();
  const TIME_LIMIT = 1000;
  const notifications = useNotifications();
  queryClient
    .fetchQuery(userOptions())
    .then(
      getCallbackForArrivedUserList(
        defaultUserId,
        defaultUsername,
        setActiveUsername,
        EXPIRATION_DAYS,
        notifications,
        timeStamp,
        TIME_LIMIT,
      ),
    );
  //* Set a new version of setActiveUserId that also updates the cookie and activeUsername
  const newSetActiveUserId = useUpgradeSetActiveUserId(
    setActiveUserId,
    setActiveUsername,
    activeUsername,
    queryClient,
  );
  //* Done!

  //* Set a new version of setPreferences that also updates the localStorage
  const newSetPreferences = upgradeSetPreferences(setPreferences);

  //* Set a new version of setYear that also updates the URL
  const newSetYear = upgradeSetYear(setYear, navigate);

  React.useEffect(() => {
    if (urlParams?.year) {
      const parsedYear = urlParams.year;
      if (AVAILABLE_YEARS.includes(parsedYear)) {
        setYear(parsedYear);
      }
    }
  }, [urlParams?.year]);

  const contextValue = useMemo(() => {
    return {
      // selectedTab,
      // setSelectedTab,
      activeUserId,
      activeUsername,
      setActiveUserId: newSetActiveUserId, //* This one sets the username and cookies too
      preferences,
      setPreferences: newSetPreferences, //* This one updates the localStorage too
      year,
      setYear: newSetYear, //* This one updates the URL too
    };
  }, [activeUsername, preferences, year]);

  return (
    <OscarAppContext.Provider value={contextValue}>
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

//* returns a new version of setActiveUserId that also updates the cookie and activeUsername
//* In principle, it shouldn't be possible to call the upgraded setActiveUserId
//* without the the username and both cookies also being set to match the new value
//* The only exception would be if there is no UserList available, in which case we show an error message
function useUpgradeSetActiveUserId(
  setActiveUserId: (id: UserId | null) => void,
  setActiveUsername: (username: string | null) => void,
  activeUsername: string | null,
  queryClient: QueryClient,
): (id: UserId | null) => void {
  const notifications = useNotifications();
  return (id: UserId | null) => {
    const timeStamp = Date.now();
    setActiveUserId(id);
    Cookies.set('activeUserId', id as string, {
      expires: EXPIRATION_DAYS,
    });

    const TIME_LIMIT = 500; //* milliseconds
    //* Adjust as needed, this is the allowable delay between setting
    //* the userId and the username without showing an error

    queryClient
      .ensureQueryData(userOptions())
      .then(
        getCallbackForArrivedUserList(
          id,
          activeUsername,
          setActiveUsername,
          EXPIRATION_DAYS,
          notifications,
          timeStamp,
          TIME_LIMIT,
        ),
      );
  };
}

function getCallbackForArrivedUserList(
  activeUserId: UserId | null,
  activeUsername: string | null,
  setUsername: (username: string | null) => void,
  EXPIRATION_DAYS: number,
  notifications: NotificationsDispatch,
  timeStamp: number,
  timeLimit?: number,
): (data: UserList) => void {
  return (data: UserList) => {
    const suggestedUsername = getUsernameFromId(activeUserId ?? '', data);
    if (
      activeUsername !== suggestedUsername &&
      timeLimit &&
      Date.now() - timeStamp > timeLimit
    ) {
      warnToConsole(
        `The activeUsername ${activeUsername} doesn't match the activeUserId ${activeUserId}.\n'+
        'The activeUserId ${activeUserId} is associated with the username ${suggestedUsername}.\n'+
        'Attempting to fix...`,
      );
      notifications.show({
        type: 'error',
        message:
          'The username was incorrectly set. If it remains incorrect, reload the page.',
        //* Note to self: It's also possible that the userId is invalid, but that seems less likely
      });
    }
    setUsername(suggestedUsername);
    Cookies.set('activeUsername', suggestedUsername as string, {
      expires: EXPIRATION_DAYS,
    });
  };
}

//* Returns a new version of setPreferences that also updates the localStorage
//* Similar in spirit to useUpgradeSetActiveUserId, but it should be simpler
//* because it doesn't need to coordinate with any backend data
function upgradeSetPreferences(
  setPreferences: (pref: Preferences) => void,
): (pref: Preferences) => void {
  return (pref: Preferences) => {
    setPreferences(pref);
    localStorage.setItem('preferences', JSON.stringify(pref));
  };
}

function getPreferenceStateAtStartup(
  defaultPreferences: Preferences,
): Preferences {
  const preferences = localStorage.getItem('preferences');
  if (!preferences) {
    return defaultPreferences;
  }
  const storedVals = JSON.parse(preferences);
  if (!Object.keys(storedVals).every(key => key in defaultPreferences)) {
    warnToConsole(
      `The preferences in localStorage are invalid. \nThey are labeled {${Object.keys(
        storedVals,
      ).join(', ')}} \nbut I was expecting {${Object.keys(
        defaultPreferences,
      ).join(', ')}}.`,
    );
    return defaultPreferences;
  }
  const bestGuess = Object.fromEntries(
    Object.keys(defaultPreferences).map(key => {
      if (!(key in storedVals)) {
        return [key, defaultPreferences[key as keyof Preferences]];
      }
      return [key, storedVals[key]];
    }),
  ) as Preferences;
  return bestGuess;
}

//* Returns a new version of setYear that also updates the URL
function upgradeSetYear(
  setYear: (year: number) => void,
  navigate: ReturnType<typeof useNavigate>,
): (year: number) => void {
  return (year: number) => {
    setYear(year);
    const currentPath = window.location.pathname;
    const match = currentPath.match(/(\d{4})/);
    if (match) {
      navigate(currentPath.replace(match[0], year.toString()), {replace: true});
    } else {
      navigate(`/${year}`, {replace: true});
    }
  };
}
