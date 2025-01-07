import {useQuery, useSuspenseQuery} from '@tanstack/react-query';
import {useContext} from 'react';
import {useOscarAppContext} from '../contexts/AppContext';
import {DataFlavor, WatchStatus} from '../types/Enums';
import LockError from '../types/LockErorr';
import {WatchNotice, User, Movie, Nom, Category} from '../types/APIDataSchema';

export function useMyMovies(): ReturnType<typeof useQuery<Movie[]>> {
  const results = useMyQuery(DataFlavor.movies);
  if (checkData(results.data, DataFlavor.movies)) {
    return results as ReturnType<typeof useQuery<Movie[]>>;
  }
  throw new Error(
    'useSuspenseQuery returned something ill-formed, ' +
      "data is neither a Promise nor ===undefined but it ain't a Data[] neither",
  );
}
export function useMyUsers(): ReturnType<typeof useQuery<User[]>> {
  const results = useMyQuery(DataFlavor.users);
  if (checkData(results.data, DataFlavor.users)) {
    return results as ReturnType<typeof useQuery<User[]>>;
  }
  throw new Error(
    'useSuspenseQuery returned something ill-formed, ' +
      "data is neither a Promise nor ===undefined but it ain't a Data[] neither",
  );
}
export function useMyNominations(): ReturnType<typeof useQuery<Nom[]>> {
  const results = useMyQuery(DataFlavor.nominations);
  if (checkData(results.data, DataFlavor.nominations)) {
    return results as ReturnType<typeof useQuery<Nom[]>>;
  }
  throw new Error(
    'useSuspenseQuery returned something ill-formed, ' +
      "data is neither a Promise nor ===undefined but it ain't a Data[] neither",
  );
}
export function useMyCategories(): ReturnType<typeof useQuery<Category[]>> {
  const results = useMyQuery(DataFlavor.categories);
  if (checkData(results.data, DataFlavor.categories)) {
    return results as ReturnType<typeof useQuery<Category[]>>;
  }
  throw new Error(
    'useSuspenseQuery returned something ill-formed, ' +
      "data is neither a Promise nor ===undefined but it ain't a Data[] neither",
  );
}
export function useMyWatchlist(): ReturnType<typeof useQuery<WatchNotice[]>> {
  const results = useMyQuery(DataFlavor.watchlist);
  if (checkData(results.data, DataFlavor.watchlist)) {
    return results as ReturnType<typeof useQuery<WatchNotice[]>>;
  }
  throw new Error(
    'useSuspenseQuery returned something ill-formed, ' +
      "data is neither a Promise nor ===undefined but it ain't a Data[] neither",
  );
}

export function useMyQuery(
  dFlavor: DataFlavor,
): ReturnType<typeof useSuspenseQuery<any[]>> {
  const qParams = flavorToParams(dFlavor);
  const results = useSuspenseQuery({
    queryKey: [dFlavor],
    queryFn: async (): Promise<any[]> => {
      const params = new URLSearchParams(qParams);
      const response = await fetch(`api/${dFlavor}?${params.toString()}`, {
        method: 'GET',
      });
      if (!response.ok) {
        if (response.status === 429) {
          throw new LockError('Data was locked.');
        }
        throw new Error(
          `Data fetch returned error code: ${
            response.status
          } - ${response.json()}`,
        );
      }
      const data = response.json();
      //checkGetter(dFlavor)(data);
      return data;
    },
    retry: (failureCount, error) => {
      console.log(
        `Data type: ${dFlavor}, retry count: ${failureCount}, error: ${error}`,
      );
      if (error instanceof LockError && failureCount < 10) {
        return true;
      } else if (failureCount < 3) {
        return true;
      }
      return false;
    },
  });
  if (checkData(results.data, dFlavor) || results.data === undefined) {
    return results;
  }
  console.log("I'm surprised this is happening");
  return results;
  //throw new Error(`${dFlavor} Data is not an array of ${dFlavor}`);
}

//type Data = Movie | User | Nom | Category | WatchNotice;

// Type guard that ensures data is Data[]
// Returns false if data is missing (undefined, still a Promise)
// Throws an error if the data is present but of the wrong type
function checkData(
  data: unknown,
  dFlavor: DataFlavor,
): data is flavorToType[typeof dFlavor][] {
  if (data instanceof Promise) {
    console.log('Data is a Promise, this is being run too soon.');
    return false;
  }
  if (data === undefined) return false;
  if (!Array.isArray(data)) return false;

  if (
    !data.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        flavorToFields[dFlavor].every(field => field in item),
    )
  ) {
    return false;
  }
  return true;
}
function checkGetter(dFlavor: DataFlavor): (data: unknown) => boolean {
  if (dFlavor === DataFlavor.users) {
    return checkUser;
  } else if (dFlavor === DataFlavor.movies) {
    return checkMovie;
  } else if (dFlavor === DataFlavor.nominations) {
    return checkNom;
  } else if (dFlavor === DataFlavor.categories) {
    return checkCategory;
  } else if (dFlavor === DataFlavor.watchlist) {
    return checkWatchNotice;
  }
  return (data: unknown) => checkData(data, dFlavor);
}
function checkUser(data: unknown): data is User[] {
  return checkData(data, DataFlavor.users);
}
function checkMovie(data: unknown): data is Movie[] {
  return checkData(data, DataFlavor.movies);
}
function checkNom(data: unknown): data is Nom[] {
  return checkData(data, DataFlavor.nominations);
}
function checkCategory(data: unknown): data is Category[] {
  return checkData(data, DataFlavor.categories);
}
function checkWatchNotice(data: unknown): data is WatchNotice[] {
  return checkData(data, DataFlavor.watchlist);
}

const flavorToFields = {
  [DataFlavor.movies]: ['id', 'title'],
  [DataFlavor.users]: ['id', 'username'],
  [DataFlavor.nominations]: ['catId', 'movieId', 'note'],
  [DataFlavor.categories]: [
    'id',
    'shortName',
    'fullName',
    'hasNote',
    'isShort',
    'grouping',
    'maxNoms',
  ],
  [DataFlavor.watchlist]: ['movieId', 'userId', 'status'],
};
const flavorToParams = (dFlavor: DataFlavor): Record<string, string> => {
  switch (dFlavor) {
    case DataFlavor.movies: {
      const {year} = useOscarAppContext();
      return {year: year.toString()};
    }
    case DataFlavor.users: {
      return {};
    }
    case DataFlavor.nominations: {
      const {year} = useOscarAppContext();
      return {year: year.toString()};
    }
    case DataFlavor.categories: {
      return {};
    }
    case DataFlavor.watchlist: {
      const {year} = useOscarAppContext();
      return {year: year.toString(), justMe: 'false'};
    }
    default: {
      throw new Error(`Unknown data flavor: ${dFlavor}`);
    }
  }
};
const protoUser = {id: '', username: ''};
const protoMovie = {id: '', title: ''};
const protoNom = {catId: '', movieId: '', note: ''};
const protoCategory = {
  id: '',
  shortName: '',
  fullName: '',
  hasNote: false,
  isShort: false,
  grouping: '',
  maxNoms: 0,
};
const protoWatchNotice = {movieId: '', userId: '', status: WatchStatus.blank};
//const flavorToType: Record<DataFlavor, Data> = {
//  [DataFlavor.users]: protoUser,
//  [DataFlavor.movies]: protoMovie,
//  [DataFlavor.nominations]: protoNom,
//  [DataFlavor.categories]: protoCategory,
//  [DataFlavor.watchlist]: protoWatchNotice,
//};
type flavorToType = {
  users: User;
  movies: Movie;
  nominations: Nom;
  categories: Category;
  watchlist: WatchNotice;
};
