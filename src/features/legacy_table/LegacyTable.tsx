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
import {ColumnLabel} from '../../components/TableHeader';
import {useSuspenseQueries} from '@tanstack/react-query';
import {useOscarAppContext} from '../../providers/AppContext';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {logToConsole} from '../../utils/Logger';
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
  logToConsole(movies.length);
  logToConsole(filteredMovies.length);
  const {features, shortsAnimated, shortsLive, shortsDoc} = groupByShort(
    filteredMovies,
    nominations,
  );
  logToConsole(features.length);

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
        scrollBehavior: 'smooth',
        overflowY: 'auto',
        height: 'calc(100vh - 64px)',
        width: '100%',
      }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <ColumnLabel text="" />
            <ColumnLabel
              text="Film"
              sx={{maxWidth: '10ch', overflow: 'wrap'}}
            />
            <ColumnLabel text="Nominated For" />
            <ColumnLabel
              text="Runtime"
              onClick={() => setIsRuntimeFormatted(!isRuntimeFormatted)}
              style={{cursor: 'pointer'}}
              title="Click to toggle runtime format"
              icon={<SwapHoriz />}
            />
            {sortedUsers.map(user => (
              <ColumnLabel key={user.id} text={user.username} />
            ))}
          </TableRow>
        </TableHead>
        <TableBody sx={{borderRadius: 5}}>
          <MovieRows filteredMovies={sortedData} {...rowProps} />
          <ShortsMovieRows
            filteredMovies={sortedShortsLive}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
          <ShortsMovieRows
            filteredMovies={sortedShortsAnimated}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
          <ShortsMovieRows
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
