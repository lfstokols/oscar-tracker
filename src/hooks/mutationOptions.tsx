import {QueryClient, QueryKey} from '@tanstack/react-query';
import {NotificationsDispatch} from '../providers/NotificationContext';
import {
  MyUserDataSchema,
  UserIdSchema,
  UserListSchema,
} from '../types/APIDataSchema';
import {z} from 'zod';
import {userOptions} from './dataOptions';
import {errorToConsole} from '../utils/Logger';
import {API_BASE_URL} from '../config/GlobalConstants';

// *
// * Genera Stuff // *
// *

export function updateCacheOnSuccess<T>(
  queryKey: QueryKey,
  parser: (data: unknown) => T,
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
    errorToConsole(response);
    notifications.show({
      type: 'error',
      message: message,
    });
  };
}

// *
// * Mutation Functions // *
// *

export function updateWatchlistMutationFn(movieIds: MovieId[], year: number) {
  return async (newState: WatchStatus) => {
    const body = JSON.stringify({movieIds, status: newState, year});
    return await fetch(`${API_BASE_URL}/watchlist`, {
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
    return await fetch(`${API_BASE_URL}/users`, {
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
  return async (
    data: Partial<z.input<typeof MyUserDataSchema>>,
  ): Promise<Response> => {
    const body = JSON.stringify(data);
    return await fetch(`${API_BASE_URL}/users`, {
      method: 'PUT',
      body,
      headers: {'Content-Type': 'application/json'},
    });
  };
}

export function deleteUserMutationFn(_userId: UserId, password: string) {
  return async (userId: UserId) => {
    const params = new URLSearchParams({userId});
    const body = JSON.stringify({userId, delete: true, [password]: true});
    return await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
      method: 'DELETE',
      body,
      headers: {'Content-Type': 'application/json'},
    });
  };
}
