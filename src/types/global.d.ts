import * as zodTypes from './APIDataSchema';
declare global {
  // * Primitive Types
  type UserId = zodTypes.UserId;
  type MovieId = zodTypes.MovieId;
  type CategoryId = zodTypes.CategoryId;
  type WatchStatus = zodTypes.WatchStatus;

  // * Object Types
  type User = zodTypes.User;
  type Movie = zodTypes.Movie;
  type Nom = zodTypes.Nom;
  type Category = zodTypes.Category;
  type WatchNotice = zodTypes.WatchNotice;

  // * Collection Types
  type UserList = zodTypes.UserList;
  type MovieList = zodTypes.MovieList;
  type NomList = zodTypes.NomList;
  type CategoryList = zodTypes.CategoryList;
  type WatchList = zodTypes.WatchList;

  //type DataFlavor = 'movies' | 'users' | 'nominations' | 'categoriess' | 'watchlist';

  //type MovieId = Opaque<string, 'MovieId'>;
  //type UserId = Opaque<string, 'UserId'>;
  //type CategoryId = Opaque<string, 'CategoryId'>;

  //  type User = {
  //    id: UserId;
  //    username: string;
  //    //[other: string]: any,
  //  };
  //
  //  type Movie = {
  //    id: MovieId;
  //    title: string;
  //    //[other: string]: any,
  //  };
  //
  //  type Nom = {
  //    movieId: MovieId;
  //    catId: CategoryId;
  //    note: string;
  //  };
  //
  //  type Category = {
  //    id: CategoryId;
  //    shortName: string;
  //    fullName: string;
  //    hasNote: boolean;
  //    isShort: boolean;
  //    grouping: string;
  //    maxNoms: number;
  //  };
  //
  //  type WatchNotice = {
  //    userId: UserId;
  //    movieId: MovieId;
  //    status: WatchStatus;
  //  };

  //  export {User, Movie, Nom, Category, WatchNotice};

  //type watchStatus = 'seen' | 'todo' | '';

  type Preferences = {
    shortsAreOneFilm: boolean;
    highlightAnimated: boolean;
    lockSeenToggle: boolean; // * if true, the user can only toggle between blank and todo. 'seen' can't be entered or exited, except via letterboxd (or changing the preference)
  };

  //type Movie = {
  //	title: string,
  //	nominations: string[],
  //}

  //type RawMap = {
  //	movies: Movie,
  //	users: User,
  //	noms: Noms,
  //	cats: Category,
  //	watchlist: WatchNotice,
  //}

  //type RawTypes = [Movie, User, Noms, Category, WatchNotice];

  //type RawFromFlavor<T extends keyof RawMap> = RawMap[T];

  //type Data = {
  //	users: User[],
  //	movies: Movie[],
  //}

  //interface ApiResponse<T> {
  //  data: T;
  //  error?: string;
  //}
}

export {}; // Ensures this file is treated as a module
