import {queryOptions} from '@tanstack/react-query';
import {DataFlavor} from '../types/Enums';
import LockError from '../types/LockErorr';
import {
  CategoryListSchema,
  MovieListSchema,
  NomListSchema,
  UserListSchema,
  WatchListSchema,
  MyUserDataSchema,
} from '../types/APIDataSchema';

// * Nominations // *
export function nomOptions(year: number) {
  return queryOptions({
    queryKey: ['nominations', year],
    queryFn: qFunction(
      DataFlavor.nominations,
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
    queryFn: qFunction(DataFlavor.users, {}, UserListSchema.parse),
    retry: retryFunction,
  });
}

export function myUserDataOptions(userId: UserId) {
  return queryOptions({
    queryKey: ['myUserData', userId],
    queryFn: qFunction(
      DataFlavor.users,
      {myData: 'true'},
      MyUserDataSchema.parse,
    ),
    retry: retryFunction,
  });
}

// * Movies // *
export function movieOptions(year: number) {
  return queryOptions({
    queryKey: ['movies', year],
    queryFn: qFunction(
      DataFlavor.movies,
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
    queryFn: qFunction(DataFlavor.categories, {}, CategoryListSchema.parse),
    retry: retryFunction,
  });
}

// * Watchlist // *
export function watchlistOptions(year: number) {
  return queryOptions({
    queryKey: ['watchlist', year],
    queryFn: qFunction(
      DataFlavor.watchlist,
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
  dFlavor: DataFlavor,
  qParams: Record<string, string>,
  parser: (data: any) => T,
): () => Promise<T> {
  //ReturnType<typeof parser>> {
  return async () => {
    const params = new URLSearchParams(qParams);
    const response = await fetch(`api/${dFlavor}?${params.toString()}`, {
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
    return parser(await response.json());
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
