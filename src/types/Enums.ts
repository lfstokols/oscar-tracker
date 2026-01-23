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
  letterboxdSearch = 'forward/letterboxd/search',
  nextKeyDate = 'next_key_date',
  moviedbForward = 'forward/moviedb',
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

export enum CategoryType {
  // Big Three
  best_picture = 'cat_pict',
  director = 'cat_dirc',
  original_screenplay = 'cat_oscp',
  adapted_screenplay = 'cat_ascp',
  // Acting
  best_actor = 'cat_mact',
  best_actress = 'cat_fact',
  supporting_actor = 'cat_msac',
  supporting_actress = 'cat_fsac',
  // Art
  costumes = 'cat_cstu',
  makeup_and_hair = 'cat_mkup',
  production_design = 'cat_prod',
  visual_effects = 'cat_vfxx',
  // Audio
  score = 'cat_scor',
  original_song = 'cat_song',
  sound = 'cat_soun',
  // Filmkraft
  cinematography = 'cat_cine',
  editing = 'cat_edit',
  // Best in Class
  animated_feature = 'cat_anim',
  foreign_film = 'cat_frgn',
  documentary = 'cat_docu',
  // Shorts
  animated_short = 'cat_sanm',
  live_action_short = 'cat_shla',
  documentary_short = 'cat_sdoc',
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
