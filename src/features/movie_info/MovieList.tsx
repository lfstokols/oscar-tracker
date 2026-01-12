// Mobile-friendly list of MovieCards to replace LegacyTable
import Grid from '@mui/material/Grid2';
import {useSuspenseQueries} from '@tanstack/react-query';
import * as React from 'react';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {ShortsType, WatchStatus} from '../../types/Enums';
import {groupByShort} from '../../utils/dataSelectors';
import MovieCard from './MovieCard';
import ShortsCard from './ShortsCard';

function GridItem({movie}: {movie: Movie}): React.ReactElement {
  return (
    <Grid key={movie.id} size={{xs: 12, sm: 6, md: 4, lg: 3, xl: 2}}>
      <MovieCard movie={movie} />
    </Grid>
  );
}

export default function MovieList({
  filterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
}): React.ReactElement {
  const {year, preferences, activeUserId} = useOscarAppContext();

  const [_usersQ, nominationsQ, _categoriesQ, moviesQ, watchlistQ] =
    useSuspenseQueries({
      queries: [
        userOptions(),
        nomOptions(year),
        categoryOptions(),
        movieOptions(year),
        watchlistOptions(year),
      ],
    });
  const nominations = nominationsQ.data;
  const myWatchlist = watchlistQ.data.filter(
    watch => watch.userId === activeUserId,
  );
  const movies = moviesQ.data;

  const filteredMovies = filterMovies(
    movies,
    nominations,
    myWatchlist,
    filterState,
  );
  const {features, shortsAnimated, shortsLive, shortsDoc} = groupByShort(
    filteredMovies,
    nominations,
  );

  const sortedFeatures = features.sort((a, b) =>
    a.numNoms > b.numNoms ? -1 : 1,
  );
  const sortedShortsAnimated = shortsAnimated.sort((a, b) =>
    a.mainTitle.localeCompare(b.mainTitle),
  );
  const sortedShortsLive = shortsLive.sort((a, b) =>
    a.mainTitle.localeCompare(b.mainTitle),
  );
  const sortedShortsDoc = shortsDoc.sort((a, b) =>
    a.mainTitle.localeCompare(b.mainTitle),
  );

  const shortsAreOneFilm = preferences.shortsAreOneFilm;

  const featureCards = sortedFeatures.map(movie => (
    <GridItem key={movie.id} movie={movie} />
  ));
  const animatedShortsCards = shortsSection(
    ShortsType.animated,
    sortedShortsAnimated,
    shortsAreOneFilm,
  );
  const liveActionShortsCards = shortsSection(
    ShortsType.liveAction,
    sortedShortsLive,
    shortsAreOneFilm,
  );
  const documentaryShortsCards = shortsSection(
    ShortsType.documentary,
    sortedShortsDoc,
    shortsAreOneFilm,
  );
  const allCards = featureCards.concat(
    animatedShortsCards,
    liveActionShortsCards,
    documentaryShortsCards,
  );

  return (
    <Grid container spacing={1.5} sx={{p: 1, width: '100%'}}>
      {allCards}
    </Grid>
  );
}

/**
  Returns an array of GridItems, either a unified ShortsCard 
  or a list of MovieCards, depending on the shortsAreOneFilm preference.
  @param type - The specific category of shorts
  @param movies - The movies to display
  @param shortsAreOneFilm - Whether to display the shorts as a single card
  @returns An array of GridItems (possibly length 1)
*/
function shortsSection(
  type: ShortsType,
  movies: Movie[],
  shortsAreOneFilm: boolean,
): React.ReactElement[] {
  if (shortsAreOneFilm) {
    return [
      <Grid key={type} size={{xs: 12, sm: 6, md: 4, lg: 3, xl: 2}}>
        <ShortsCard movies={movies} type={type} />
      </Grid>,
    ];
  }
  return movies.map(movie => <GridItem key={movie.id} movie={movie} />);
}

function filterMovies(
  movies: Movie[],
  nominations: Nom[],
  myWatchlist: WatchNotice[],
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]},
): Movie[] {
  let currentMovies = movies;
  if (filterState.watchstatus.length !== 0) {
    currentMovies = movies.filter(movie => {
      const status =
        myWatchlist.find(watch => watch.movieId === movie.id)?.status ??
        WatchStatus.blank;
      return filterState.watchstatus.includes(status);
    });
  }
  if (filterState.categories.length !== 0) {
    currentMovies = currentMovies.filter(movie => {
      const myNoms = nominations.filter(nom => nom.movieId === movie.id);
      return myNoms.some(nom =>
        filterState.categories.includes(nom.categoryId),
      );
    });
  }

  return currentMovies;
}
