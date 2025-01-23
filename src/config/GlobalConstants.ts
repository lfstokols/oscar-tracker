import { Grouping } from "../types/Enums";

// Default year in year selector
export const DEFAULT_YEAR = 2023; // ? How ought this be set?

//* Cookie expiration time in days
//* I just set it to a little over a year to be safe, whatever
export const EXPIRATION_DAYS = 400;

//* Default time to diplay notification toast
export const DEFAULT_HIDE_DURATION_MS = 4000; // 4 seconds

//* Numbers related to short films
//* I'm hardcoding these for now, because as far as I know they've
//* never actually changed
export const NUM_SHORT_CATEGORIES = 3;
export const NUM_SHORT_FILMS_PER_CATEGORY = 5;

//* How to get tmdb posters
export const MovieDb_POSTER_URL = "https://image.tmdb.org/t/p/w185";

//* Default preferences
export const DEFAULT_PREFERENCES = {
  shortsAreOneFilm: false,
  highlightAnimated: false,
  lockSeenToggle: false,
  hiddenColumns: {
    legacy: [],
  },
  hiddenUsers: [],
};

//* Minimum length of search input
export const MIN_SEARCH_LENGTH = 1;
