import {QueryClient} from '@tanstack/react-query';
import {NotificationsDispatch} from '../providers/NotificationContext';
import {
  MyUserDataSchema,
  UserIdSchema,
  UserListSchema,
  UserSchema,
} from '../types/APIDataSchema';
import {z} from 'zod';
import {userOptions} from './dataOptions';

// *
// * Genera Stuff // *

// *
export function updateCacheOnSuccess<T>(
  queryKey: any,
  parser: (data: any) => T,
  queryClient: QueryClient,
) {
  return async (response: Response) => {
    return queryClient.setQueryData(queryKey, parser(await response.json()));
  };
}

export function onMutateError(
  message: string,
  notifications: NotificationsDispatch,
) {
  return async (response: Response) => {
    console.log(response);
    notifications.show({
      type: 'error',
      message: message,
    });
  };
}

// *
// * Mutation Functions // *
// *

export function updateWatchlistMutationFn(movieId: MovieId, year: number) {
  return async (newState: WatchStatus) => {
    const body = JSON.stringify({movieId, status: newState, year});
    return await fetch('api/watchlist', {
      method: 'PUT',
      body,
      headers: {'Content-Type': 'application/json'},
    });
  };
}

// this typecheck won't catch if you put a userId into `data`, but don't do that
export function addUserMutationFn() {
  return async ({
    username,
    data,
  }: {
    username: string;
    data: Partial<z.input<typeof MyUserDataSchema>>;
  }) => {
    const body = JSON.stringify({username, ...data});
    return await fetch('api/users', {
      method: 'POST',
      body,
      headers: {'Content-Type': 'application/json'},
    });
  };
}

export function addUserOnSuccess(
  queryClient: QueryClient,
  setActiveUserId: (userId: UserId) => void,
) {
  return async (response: Response) => {
    const data = await response.json();
    const newId = UserIdSchema.parse(data.userId);
    const newState = UserListSchema.parse(data.users);
    setActiveUserId(newId);
    queryClient.setQueryData(userOptions().queryKey, newState);
  };
}

export function updateUserMutationFn() {
  return async (data: Partial<z.input<typeof MyUserDataSchema>>): Promise<Response> => {
    const body = JSON.stringify(data);
    return await fetch('api/users', {
      method: 'PUT',
      body,
      headers: {'Content-Type': 'application/json'},
    });
  };
}
