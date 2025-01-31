import {QueryClient, useQueryClient} from '@tanstack/react-query';
import Cookies from 'js-cookie';
import {useEffect, useState} from 'react';
import {COOKIE_NULL_VALUE, EXPIRATION_DAYS} from '../config/GlobalConstants';
import {
  NotificationsDispatch,
  useNotifications,
} from '../providers/NotificationContext';
import {UserIdSchema} from '../types/APIDataSchema';
import {errorToConsole, warnToConsole} from '../utils/Logger';
import {getUsernameFromId} from '../utils/dataSelectors';
import {userOptions} from './dataOptions';

export default function useActiveUserState(): [
  UserId | null,
  string | null,
  (id: UserId | null) => void,
] {
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
  const TIME_LIMIT = 1000; // TODO - Make this a config variable
  const notifications = useNotifications();
  
  useEffect(() => {
    const timeStamp = Date.now();
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
      )
      .catch(error => {
        errorToConsole(error);
      });
  }, [defaultUserId, defaultUsername, notifications, queryClient]);
  
  //* Set a new version of setActiveUserId that also updates the cookie and activeUsername
  const newSetActiveUserId = useUpgradeSetActiveUserId(
    setActiveUserId,
    setActiveUsername,
    activeUsername,
    queryClient,
  );
  //* Done!

  return [activeUserId, activeUsername, newSetActiveUserId];
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
    Cookies.set('activeUserId', id ?? COOKIE_NULL_VALUE, {
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
      )
      .catch(error => {
        errorToConsole(error);
      });
  };
}

function getCallbackForArrivedUserList(
  activeUserId: UserId | null,
  activeUsername: string | null,
  setUsername: (username: string | null) => void,
  expirationDays: number,
  notifications: NotificationsDispatch,
  timeStamp: number,
  timeLimit?: number,
): (data: UserList) => void {
  return (data: UserList) => {
    const suggestedUsername = getUsernameFromId(activeUserId ?? '', data);
    if (suggestedUsername != activeUsername) {
      if (
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
      Cookies.set('activeUsername', suggestedUsername ?? COOKIE_NULL_VALUE, {
        expires: expirationDays,
      });
    }
  };
}
