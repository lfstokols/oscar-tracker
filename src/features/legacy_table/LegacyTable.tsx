import {SwapHoriz} from '@mui/icons-material';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import * as React from 'react';
import {useState} from 'react';
import {TableHeaderCell} from '../../components/TableHeader';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {FilterState} from '../../hooks/useFilterState';
import {useOscarAppContext} from '../../providers/AppContext';
import {groupByShort, useSortUsers} from '../../utils/dataSelectors';
import filterMovies from '../both_movie_views/filterMovies';
import MovieRows from './MovieRows';
import ShortsMovieRows from './ShortsMovieRows';

// export const columnList = ['title', 'nominations', 'runtime'];

export default function LegacyTable({
  filterState,
}: {
  filterState: FilterState;
}): React.ReactElement {
  const {year, preferences, activeUserId} = useOscarAppContext();
  const [isRuntimeFormatted, setIsRuntimeFormatted] = useState(true);

  const [usersQ, nominationsQ, categoriesQ, moviesQ, watchlistQ] =
    useSuspenseQueries({
      queries: [
        userOptions(),
        nomOptions(year),
        categoryOptions(year),
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
            <TableHeaderCell key="film" colSpan={2} text="Film" />
            <TableHeaderCell key="nominations" text="Nominations" />
            <TableHeaderCell key="external" text="External Links" />
            <TableHeaderCell
              key="runtime"
              icon={<SwapHoriz />}
              onClick={() => setIsRuntimeFormatted(!isRuntimeFormatted)}
              style={{cursor: 'pointer'}}
              text="Runtime"
              title="Click to toggle runtime format"
            />
            {sortedUsers.map(user => (
              <TableHeaderCell key={user.id} text={user.username} />
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <MovieRows filteredMovies={sortedData} {...rowProps} />
          <ShortsMovieRows
            key="sortedShortsLive"
            filteredMovies={sortedShortsLive}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
          <ShortsMovieRows
            key="sortedShortsAnimated"
            filteredMovies={sortedShortsAnimated}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
          <ShortsMovieRows
            key="sortedShortsDoc"
            filteredMovies={sortedShortsDoc}
            merge={shortsAreOneFilm}
            {...rowProps}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}
