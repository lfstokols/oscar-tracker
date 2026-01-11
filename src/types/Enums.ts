export enum WatchStatus {
  seen = 'seen',
  todo = 'todo',
  blank = 'blank',
}

export enum AppTabType {
  legacy = 'legacy',
  // byMovie = 'byMovie',
  byCategory = 'byCategory',
  byUser = 'byUser',
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
  movies = 'movies',
  users = 'users',
  myUserData = 'users/my_data',
  nominations = 'nominations',
  categories = 'categories',
  watchlist = 'watchlist',
  byUser = 'by_user',
  byCategory = 'by_category',
  letterboxdSearch = 'letterboxd/search',
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
