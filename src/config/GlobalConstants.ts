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
export const MovieDb_POSTER_URL = 'https://image.tmdb.org/t/p/w185';
export const MovieDb_POSTER_URL_XL = 'https://image.tmdb.org/t/p/w500';

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

//* Urls
export const FEATURE_REQUEST_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdZoo8OeT0y7BPiERtv8rtSA1VFNzG0FhjukGNcrIOQOYxKvw/viewform?usp=dialog';
export const REPORT_BUG_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdZoo8OeT0y7BPiERtv8rtSA1VFNzG0FhjukGNcrIOQOYxKvw/viewform?usp=dialog';

//* Route URLs
export const MOVIES_URL = 'home';
export const LEGACY_URL = 'legacy';
export const BY_USER_URL = 'leaderboard';
export const BY_CATEGORY_URL = 'categories';
export const API_BASE_URL = '/api';
export const HOME_URL = MOVIES_URL; // Used when you want to return the home page, whatever that may be

//* What to set the cookie as if logged out
export const COOKIE_NULL_VALUE = 'null';

//* Upcoming Oscar date
export const UPCOMING_OSCAR_DATE = new Date('2026-03-15T23:00:00Z'); // Idk where to get this from except hardcoding
