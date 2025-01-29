import React, {useState} from 'react';
import {groupByShort, useSortUsers} from '../../utils/dataSelectors';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {SwapHoriz} from '@mui/icons-material';
import {TableHeaderCell} from '../../components/TableHeader';
import {useSuspenseQueries} from '@tanstack/react-query';
import {useOscarAppContext} from '../../providers/AppContext';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import MovieRows from './MovieRows';
import ShortsMovieRows from './ShortsMovieRows';

export const columnList = ['title', 'nominations', 'runtime'];

export default function LegacyTable({
  filterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
}): React.ReactElement {
  const {year, preferences, activeUserId} = useOscarAppContext();
  const [isRuntimeFormatted, setIsRuntimeFormatted] = useState(true);

  const [usersQ, nominationsQ, categoriesQ, moviesQ, watchlistQ] =
    useSuspenseQueries({
      queries: [
        userOptions(),
        nomOptions(year),
        categoryOptions(),
        movieOptions(year),
        watchlistOptions(year),
      ],
    });
  const users = usersQ.data;
  const nominations = nominationsQ.data;
  const categories = categoriesQ.data;
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

  const sortedUsers = useSortUsers(users);

  const sortedData = features.sort((a, b) => (a.numNoms > b.numNoms ? -1 : 1));
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

  const rowProps = {
    nominations,
    categories,
    preferences,
    sortedUsers,
    isRuntimeFormatted,
  };

  return (
    <TableContainer
      sx={{
        backgroundImage: 'var(--mui-overlays-1)',
        paddingBottom: 2,
        borderRadius: '5px',
      }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableHeaderCell key="film" text="Film" colSpan={2} />
            <TableHeaderCell key="nominations" text="Nominations" />
            <TableHeaderCell
              key="runtime"
              text="Runtime"
              onClick={() => setIsRuntimeFormatted(!isRuntimeFormatted)}
              style={{cursor: 'pointer'}}
              title="Click to toggle runtime format"
              icon={<SwapHoriz />}
            />
            {sortedUsers.map(user => (
              <TableHeaderCell key={user.id} text={user.username} />
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <MovieRows filteredMovies={sortedData} {...rowProps} />
          <ShortsMovieRows
            key={'sortedShortsLive'}
            filteredMovies={sortedShortsLive}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
          <ShortsMovieRows
            key={'sortedShortsAnimated'}
            filteredMovies={sortedShortsAnimated}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
          <ShortsMovieRows
            key={'sortedShortsDoc'}
            filteredMovies={sortedShortsDoc}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
        </TableBody>
      </Table>
    </TableContainer>
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
      const status = myWatchlist.find(
        watch => watch.movieId === movie.id,
      )?.status;
      return (
        (status === null && filterState.watchstatus) ||
        (status !== null && filterState.watchstatus.includes(status))
      );
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
