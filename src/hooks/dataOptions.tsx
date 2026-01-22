import {queryOptions} from '@tanstack/react-query';
import {z} from 'zod';
import {API_BASE_URL} from '../config/GlobalConstants';
import {
  CategoryCompletionSchema,
  CategoryListSchema,
  MovieId,
  MovieListSchema,
  MyUserDataSchema,
  NextKeyDateSchema,
  NomListSchema,
  UserId,
  UserListSchema,
  UserProfileSchema,
  UserStatsListSchema,
  WatchListSchema,
} from '../types/APIDataSchema';
import {Endpoints} from '../types/Enums';
import LockError from '../types/LockErorr';
import {TMDBMovie} from '../types/TMDBTypes';

// * Years // *
const zYear = z.number().int().gt(1927).lte(new Date().getFullYear());

export function yearsOptions() {
  return queryOptions({
    queryKey: ['years'],
    queryFn: qFunction(Endpoints.years, {}, z.array(zYear).parse),
    retry: retryFunction,
    staleTime: new Date() < new Date(2026, 1, 23) ? 60 * 1000 : 1000 * 60 * 60,
  });
}

export function defaultYearOptions() {
  return queryOptions({
    queryKey: ['defaultYear'],
    queryFn: qFunction(Endpoints.defaultYear, {}, zYear.parse),
    retry: retryFunction,
    staleTime: new Date() < new Date(2026, 1, 23) ? 60 * 1000 : 1000 * 60 * 60,
  });
}

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
      Endpoints.myUserData,
      {userId: userId.toString()},
      MyUserDataSchema.parse,
    ),
    retry: retryFunction,
  });
}

export function userProfileOptions(userId: UserId) {
  return queryOptions({
    queryKey: ['userProfile', userId],
    queryFn: qFunction(
      Endpoints.userProfile,
      {userId: userId.toString()},
      UserProfileSchema.parse,
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
    staleTime: Infinity,
  });
}

// * Categories // *
export function categoryOptions() {
  return queryOptions({
    queryKey: ['categories'],
    queryFn: qFunction(Endpoints.categories, {}, CategoryListSchema.parse),
    retry: retryFunction,
    staleTime: Infinity,
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

// * Other // *
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

export function categoryCompletionOptions(year: number | string) {
  return queryOptions({
    queryKey: ['categoryCompletion', year.toString()],
    queryFn: qFunction(
      Endpoints.byCategory,
      {year: year.toString()},
      CategoryCompletionSchema.parse,
    ),
    retry: retryFunction,
  });
}

// * Next Key Date (for countdown) // *
const NullableNextKeyDateSchema = NextKeyDateSchema.nullable();
export function nextKeyDateOptions() {
  return queryOptions({
    queryKey: ['nextKeyDate'],
    queryFn: qFunction(
      Endpoints.nextKeyDate,
      {},
      NullableNextKeyDateSchema.parse,
    ),
    retry: retryFunction,
    staleTime: 1000 * 60 * 60, // 1 hour - this data doesn't change often
  });
}

// * TMDB // *
export function tmdbMovieOptions(movieId: MovieId) {
  return queryOptions({
    queryKey: ['tmdb', movieId],
    queryFn: async (): Promise<TMDBMovie> => {
      const response = await fetch(
        `${API_BASE_URL}/forward/tmdb/movie/by_movie_id/${movieId}`,
      );
      if (!response.ok) {
        throw new Error(`TMDB fetch failed: ${response.status}`);
      }
      return response.json() as Promise<TMDBMovie>;
    },
    retry: retryFunction,
    staleTime: Infinity, // TMDB data doesn't change
  });
}

// *
// * Helper functions // *
// *

function qFunction<T>(
  endpoint: Endpoints,
  qParams: Record<string, string>,
  parser: (data: unknown) => T,
): () => Promise<T> {
  return async () => {
    const params = new URLSearchParams(qParams);
    const response = await fetch(
      `${API_BASE_URL}/${endpoint}?${params.toString()}`,
      {
        method: 'GET',
      },
    );
    if (!response.ok) {
      if (response.status === 429) {
        throw new LockError('Data was locked.');
      }
      throw new Error(
        `Data fetch returned error code ${response.status}: ${JSON.stringify(
          await response.json(),
        )}`,
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

function retryFunction(failureCount: number, error: Error): boolean {
  if (error instanceof LockError && failureCount < 10) {
    return true;
  } else if (failureCount < 3) {
    return true;
  }
  return false;
}
