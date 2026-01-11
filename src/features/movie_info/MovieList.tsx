// Mobile-friendly list of MovieCards to replace LegacyTable
import {Divider, Stack, Typography} from '@mui/material';
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
import {WatchStatus} from '../../types/Enums';
import {groupByShort} from '../../utils/dataSelectors';
import MovieCard from './MovieCard';

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

  return (
    <Stack spacing={1.5} sx={{p: 1}}>
      {sortedFeatures.map(movie => (
        <MovieCard key={movie.id} movie={movie} />
      ))}

      {sortedShortsAnimated.length > 0 && (
        <ShortsSection
          movies={sortedShortsAnimated}
          shortsAreOneFilm={shortsAreOneFilm}
          title="Animated Shorts"
        />
      )}

      {sortedShortsLive.length > 0 && (
        <ShortsSection
          movies={sortedShortsLive}
          shortsAreOneFilm={shortsAreOneFilm}
          title="Live Action Shorts"
        />
      )}

      {sortedShortsDoc.length > 0 && (
        <ShortsSection
          movies={sortedShortsDoc}
          shortsAreOneFilm={shortsAreOneFilm}
          title="Documentary Shorts"
        />
      )}
    </Stack>
  );
}

function ShortsSection({
  title,
  movies,
  shortsAreOneFilm,
}: {
  title: string;
  movies: Movie[];
  shortsAreOneFilm: boolean;
}): React.ReactElement {
  // TODO: Handle shortsAreOneFilm preference (merge into single card)
  void shortsAreOneFilm;
  return (
    <>
      <Divider sx={{pt: 1}}>
        <Typography color="text.secondary" variant="overline">
          {title}
        </Typography>
      </Divider>
      {movies.map(movie => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </>
  );
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
