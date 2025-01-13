import React, {useState, useMemo, useEffect, useContext, cache} from 'react';
import {AppTabType} from '../types/Enums';
import Cookies from 'js-cookie';
import {
  QueryCache,
  QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {userOptions} from '../hooks/dataOptions';
import {getUsernameFromId} from '../utils/dataSelectors';
import {useNotifications, NotificationsDispatch} from '../globalProviders/NotificationContext';
import {UserIdSchema} from '../types/APIDataSchema';
import {DEFAULT_YEAR, EXPIRATION_DAYS} from '../config/GlobalConstants';

export type OscarAppContextValue = Readonly<{
  selectedTab: AppTabType;
  setSelectedTab: (tab: AppTabType) => void;
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
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [selectedTab, setSelectedTab] = useState<AppTabType>(AppTabType.legacy);
  const [preferences, setPreferences] = useState<Preferences>({
    shortsAreOneFilm: true,
    highlightAnimated: true,
  });

  //* The username and userId need special handling, since they're set from cookies
  //* Eventually the preferences will also be defaulted from pulled data
  //* so they'll need the queryClient too. But at least the preferences don't need
  //* to be set from two separate sources validated at runtime.
  // TODO - Wait, can I just use TanStack to set the username and userId? It's fundamentally a cache thing, no? Hmm...
  const queryClient = useQueryClient();
  //* Set the default values from the cookies
  // const cookieUserId = Cookies.get('activeUserId');
  // console.log(`cookie says ${cookieUserId}`);
  // const parsedUserId = UserIdSchema.safeParse(cookieUserId);
  // console.log(`zod's parser says ${parsedUserId}`);
  // console.log(`zod's parser success? ${parsedUserId.success}`);
  // console.log(`zod's parser data? ${parsedUserId.data}`);
  // const defaultUserId = parsedUserId.success ? parsedUserId.data : null;
  // console.log(`defaultUserId is ${defaultUserId}`);
  // const cookieUsername = Cookies.get('activeUsername');
  // console.log(`cookieUsername is ${cookieUsername}`);
  // const defaultUsername = cookieUsername ?? null;
  // console.log(`defaultUsername is ${defaultUsername}`);
  const parsed = UserIdSchema.safeParse(Cookies.get('activeUserId'));
  const defaultUserId = parsed.success ? parsed.data : null;
  const defaultUsername = Cookies.get('activeUsername') ?? null;
  //* Set the state variables with cookie values
  const [activeUserId, setActiveUserId] = useState<UserId | null>(defaultUserId);
  const [activeUsername, setActiveUsername] = useState<string | null>(defaultUsername);
  //* Set a promise to check the username and userId are consistent with each other
  const timeStamp = Date.now();
  const TIME_LIMIT = 1000;
  const notifications = useNotifications();
  queryClient
    .fetchQuery(userOptions())
    .then(
      callbackForArrivedUserList(
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

  const contextValue = useMemo(() => {
    return {
      selectedTab,
      setSelectedTab,
      activeUserId,
      activeUsername,
      setActiveUserId: newSetActiveUserId, //* This one sets the username and cookies too
      preferences,
      setPreferences,
      year,
      setYear,
    };
  }, [selectedTab, activeUserId, activeUsername, preferences, year]);

  return (
    <OscarAppContext.Provider value={contextValue}>
      {/* <CookieHandler usernameSetter={setActiveUsername} /> */}
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

//* Deprecated, but I'm keeping it around for sentimental reasons
function CookieHandler({
  usernameSetter,
}: {
  usernameSetter: (username: string | null) => void;
}): React.ReactElement {
  const {activeUserId, setActiveUserId, activeUsername} = useOscarAppContext();
  // const EXPIRATION_DAYS = 400;
  const [isInitialised, setIsInitialised] = useState(false);
  const userList = useQuery(userOptions());
  const queryClient = useQueryClient();

  useEffect;

  queryClient.fetchQuery(userOptions()).then(data => {
    const suggestedUsername = getUsernameFromId(activeUserId ?? '', data);
    if (activeUsername !== suggestedUsername) {
      console.log(
        `The activeUsername ${activeUsername} doesn't match the activeUserId ${activeUserId}.
        The activeUserId ${activeUserId} is associated with the username ${suggestedUsername}. 
        Attempting to fix...`,
      );
      const notifications = useNotifications();
      notifications.show({
        type: 'error',
        message:
          'The username was incorrectly set. If it remains incorrect, reload the page.',
        //* Note to self: It's also possible that the userId is invalid, but that seems less likely
      });
      usernameSetter(suggestedUsername);
      Cookies.set('activeUsername', suggestedUsername as string, {
        expires: EXPIRATION_DAYS,
      });
    }
  });
  //   setIsInitialised(true);
  //   usernameSetter(getUsernameFromId(activeUserId ?? '', data));
  // });

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
      const notifications = useNotifications();
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
      .then(data =>
        callbackForArrivedUserList(
          id,
          activeUsername,
          setActiveUsername,
          EXPIRATION_DAYS,
          notifications,
          timeStamp,
          TIME_LIMIT,
        )(data),
      );
  };
}

function callbackForArrivedUserList(
  activeUserId: UserId | null,
  activeUsername: string | null,
  usernameSetter: (username: string | null) => void,
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
      console.log(
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
    usernameSetter(suggestedUsername);
    Cookies.set('activeUsername', suggestedUsername as string, {
      expires: EXPIRATION_DAYS,
    });
  };
}
