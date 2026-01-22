import * as zodTypes from './APIDataSchema';
import {WatchStatus as WatchStatusEnum} from './Enums';

declare global {
  // * Primitive Types
  type UserId = zodTypes.UserId;
  type MovieId = zodTypes.MovieId;
  type CategoryId = zodTypes.CategoryId;
  type WatchStatus = WatchStatusEnum;

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

  type Preferences = {
    shortsAreOneFilm: boolean;
    highlightAnimated: boolean;
    lockSeenToggle: boolean; // * if true, the user can only toggle between blank and todo. 'seen' can't be entered or exited, except via letterboxd (or changing the preference)
    hiddenColumns: {
      legacy: string[];
    };
    hiddenUsers: string[];
  };
}

export {}; // Ensures this file is treated as a module
