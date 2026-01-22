export enum WatchStatus {
  seen = 'seen',
  todo = 'todo',
  blank = 'blank',
}

// Note: order here determines display order
export enum AppTabType {
  movies = 'movies',
  // byMovie = 'byMovie',
  byCategory = 'byCategory',
  byUser = 'byUser',
  legacy = 'legacy',
  // loginPage = 'loginPage',
}

export enum DataFlavor {
  movies = 'movies',
  users = 'users',
  nominations = 'nominations',
  categories = 'categories',
  watchlist = 'watchlist',
}

export enum Endpoints {
  years = 'years',
  defaultYear = 'years/default',
  movies = 'movies',
  users = 'users',
  myUserData = 'users/my_data',
  userProfile = 'users/profile',
  nominations = 'nominations',
  categories = 'categories',
  watchlist = 'watchlist',
  byUser = 'by_user',
  byCategory = 'by_category',
  letterboxdSearch = 'letterboxd/search',
  nextKeyDate = 'next_key_date',
}

export enum Grouping {
  big_three = 'big_three',
  acting = 'acting',
  filmkraft = 'filmkraft',
  art = 'art',
  audio = 'audio',
  best_in_class = 'best_in_class',
  short = 'short',
}

export const grouping_display_names: {[key in Grouping]: string} = {
  [Grouping.big_three]: 'All Around',
  [Grouping.acting]: 'Acting',
  [Grouping.filmkraft]: 'Filmkraft',
  [Grouping.art]: 'Art',
  [Grouping.audio]: 'Audio',
  [Grouping.best_in_class]: 'Best in Class',
  [Grouping.short]: 'Short',
};

export enum ShortsType {
  animated = 'animated',
  liveAction = 'liveAction',
  documentary = 'documentary',
}
