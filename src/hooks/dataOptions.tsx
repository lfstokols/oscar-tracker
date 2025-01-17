import {queryOptions} from '@tanstack/react-query';
import {DataFlavor, Endpoints} from '../types/Enums';
import LockError from '../types/LockErorr';
import {z} from 'zod';
import {
  CategoryListSchema,
  MovieListSchema,
  NomListSchema,
  UserListSchema,
  WatchListSchema,
  MyUserDataSchema,
  UserStatsListSchema,
} from '../types/APIDataSchema';

// * Nominations // *
export function nomOptions(year: number) {
  return queryOptions({
    queryKey: ['nominations', year],
    queryFn: qFunction(
      Endpoints.nominations,
      {year: year.toString()},
      NomListSchema.parse,
    ),
    retry: retryFunction,
  });
}

// * Users // *
export function userOptions() {
  return queryOptions({
    queryKey: ['users'],
    queryFn: qFunction(Endpoints.users, {}, UserListSchema.parse),
    retry: retryFunction,
  });
}

export function myUserDataOptions(userId: UserId) {
  return queryOptions({
    queryKey: ['myUserData', userId],
    queryFn: qFunction(
      Endpoints.users,
      {myData: 'true'},
      MyUserDataSchema.parse,
    ),
    retry: retryFunction,
  });
}

export function userStatsOptions(year: number | string) {
  return queryOptions({
    queryKey: ['userStats', year.toString()],
    queryFn: qFunction(
      Endpoints.byUser,
      {year: year.toString()},
      UserStatsListSchema.parse,
    ),
    retry: retryFunction,
  });
}

// * Movies // *
export function movieOptions(year: number) {
  return queryOptions({
    queryKey: ['movies', year],
    queryFn: qFunction(
      Endpoints.movies,
      {year: year.toString()},
      MovieListSchema.parse,
    ),
    retry: retryFunction,
  });
}

// * Categories // *
export function categoryOptions() {
  return queryOptions({
    queryKey: ['categories'],
    queryFn: qFunction(Endpoints.categories, {}, CategoryListSchema.parse),
    retry: retryFunction,
  });
}

// * Watchlist // *
export function watchlistOptions(year: number) {
  return queryOptions({
    queryKey: ['watchlist', year],
    queryFn: qFunction(
      Endpoints.watchlist,
      {year: year.toString(), justMe: 'false'},
      WatchListSchema.parse,
    ),
    retry: retryFunction,
  });
}

// *
// * Helper functions // *
// *

function qFunction<T>(
  endpoint: Endpoints,
  qParams: Record<string, string>,
  parser: (data: any) => T,
): () => Promise<T> {
  //ReturnType<typeof parser>> {
  return async () => {
    const params = new URLSearchParams(qParams);
    const response = await fetch(`api/${endpoint}?${params.toString()}`, {
      method: 'GET',
    });
    if (!response.ok) {
      if (response.status === 429) {
        throw new LockError('Data was locked.');
      }
      throw new Error(
        `Data fetch returned error code ${response.status}: ${response.json()}`,
      );
    }
    try {
      return parser(await response.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `Zod validation failed for dataFlavor ${endpoint} with params ${JSON.stringify(
            qParams,
          )}`,
        );
        console.error(error.message);
      }
      throw error;
    }
  };
}

function retryFunction(failureCount: number, error: any): boolean {
  if (error instanceof LockError && failureCount < 10) {
    return true;
  } else if (failureCount < 3) {
    return true;
  }
  return false;
}

//const flavorToParams = (dFlavor: DataFlavor): Record<string, string> => {
//	  case DataFlavor.movies: {
//		const {year} = useOscarAppContext();
//		return {year: year.toString()};
//	  }
//	  case DataFlavor.users: {
//		return {};
//	  }
//	  case DataFlavor.nominations: {
//		const {year} = useOscarAppContext();
//		return {year: year.toString()};
//	  }
//	  case DataFlavor.categories: {
//		return {};
//	  }
//	  case DataFlavor.watchlist: {
//		const {year} = useOscarAppContext();
//		return {year: year.toString(), justMe: 'false'};
//	  }
//	  default: {
//		throw new Error(`Unknown data flavor: ${dFlavor}`);
//	  }
//	}
//  };
