// Mobile-friendly list of MovieCards to replace LegacyTable
import {Card, CardContent, Skeleton, Stack} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {useSuspenseQueries} from '@tanstack/react-query';
import * as React from 'react';
import {Suspense} from 'react';
import {PopupPage} from '../../components/PopupPage';
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
import MoviePage from './MoviePage';
import ShortsCard from './ShortsCard';

function MovieCardSkeleton(): React.ReactElement {
  return (
    <Card sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <CardContent sx={{p: 1.5, '&:last-child': {pb: 1.5}}}>
        <Stack direction="row" gap={1.5}>
          <Skeleton height={120} variant="rectangular" width={80} />
          <Stack gap={0.5} sx={{flex: 1}}>
            <Skeleton height={24} variant="text" width="60%" />
            <Skeleton height={20} variant="text" width="40%" />
            <Skeleton height={48} variant="rectangular" width="100%" />
          </Stack>
        </Stack>
      </CardContent>
      <Stack
        direction="row"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          px: 1.5,
          py: 1,
          mt: 'auto',
        }}>
        <Skeleton height={32} variant="rectangular" width={120} />
      </Stack>
    </Card>
  );
}

function GridItem({
  movie,
  onCardClick,
}: {
  movie: Movie;
  onCardClick: (movie: Movie) => void;
}): React.ReactElement {
  return (
    <Grid key={movie.id} size={{xs: 12, sm: 12, md: 6, lg: 4, xl: 3}}>
      <Suspense fallback={<MovieCardSkeleton />}>
        <MovieCard movie={movie} onClick={() => onCardClick(movie)} />
      </Suspense>
    </Grid>
  );
}

export default function MovieList({
  filterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
}): React.ReactElement {
  const {year, preferences, activeUserId} = useOscarAppContext();
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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

  const handleCardClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setDrawerOpen(true);
  };

  const featureCards = sortedFeatures.map(movie => (
    <GridItem key={movie.id} movie={movie} onCardClick={handleCardClick} />
  ));
  const animatedShortsCards = shortsSection(
    ShortsType.animated,
    sortedShortsAnimated,
    shortsAreOneFilm,
    handleCardClick,
  );
  const liveActionShortsCards = shortsSection(
    ShortsType.liveAction,
    sortedShortsLive,
    shortsAreOneFilm,
    handleCardClick,
  );
  const documentaryShortsCards = shortsSection(
    ShortsType.documentary,
    sortedShortsDoc,
    shortsAreOneFilm,
    handleCardClick,
  );
  const allCards = featureCards.concat(
    animatedShortsCards,
    liveActionShortsCards,
    documentaryShortsCards,
  );

  return (
    <>
      <Grid container spacing={1.5} sx={{p: 1, width: '100%'}}>
        {allCards}
      </Grid>

      <PopupPage
        open={drawerOpen}
        setOpen={setDrawerOpen}
        title={selectedMovie?.mainTitle ?? 'Movie Details'}>
        {selectedMovie ? <MoviePage movie={selectedMovie} /> : null}
      </PopupPage>
    </>
  );
}

/**
  Returns an array of GridItems, either a unified ShortsCard 
  or a list of MovieCards, depending on the shortsAreOneFilm preference.
  @param type - The specific category of shorts
  @param movies - The movies to display
  @param shortsAreOneFilm - Whether to display the shorts as a single card
  @param onCardClick - Callback when a card is clicked
  @returns An array of GridItems (possibly length 1)
*/
function shortsSection(
  type: ShortsType,
  movies: Movie[],
  shortsAreOneFilm: boolean,
  onCardClick: (movie: Movie) => void,
): React.ReactElement[] {
  if (shortsAreOneFilm && movies.length > 0) {
    return [
      <Grid key={type} size={{xs: 12, sm: 12, md: 6, lg: 4, xl: 3}}>
        <Suspense fallback={<MovieCardSkeleton />}>
          <ShortsCard
            movies={movies}
            onClick={() => {
              // Open the first movie in the collection
              const index = Math.floor(Math.random() * movies.length);
              void onCardClick(movies[index]);
            }}
            type={type}
          />
        </Suspense>
      </Grid>,
    ];
  }
  return movies.map(movie => (
    <GridItem key={movie.id} movie={movie} onCardClick={onCardClick} />
  ));
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
