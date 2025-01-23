import React, {useState, useEffect} from 'react';
import WatchlistCell from './WatchlistCell';
import TitleCell from './TitleCell';
import NominationsCell from './NominationsCell';
import {groupByShort, useSortUsers} from '../../utils/dataSelectors';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Box,
  Paper,
  Typography,
} from '@mui/material';
import {SwapHoriz} from '@mui/icons-material';
import DefaultCatcher from '../../components/LoadScreen';
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
import {CategoryIdSchema} from '../../types/APIDataSchema';
import {LogToConsole} from '../../utils/Logger';
import TableControls from './table_controls/tableControls';

export const columnList = ['title', 'nominations', 'runtime'];

function LegacyTable({
  filterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
}): React.ReactElement {
  const {year, preferences, activeUserId} = useOscarAppContext();
  const [runtimeFormatted, setRuntimeFormatted] = useState(true);

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
  LogToConsole(movies.length);
  LogToConsole(filteredMovies.length);
  const {features, shortsAnimated, shortsLive, shortsDoc} = groupByShort(
    filteredMovies,
    nominations,
  );
  LogToConsole(features.length);

  const bestPicCategoryId = CategoryIdSchema.parse('cat_pict');
  const bestPicNominees = nominations
    .filter(nom => nom.categoryId === bestPicCategoryId)
    .map(nom => nom.movieId);
  const bestAnimatedCategoryId = CategoryIdSchema.parse('cat_anim');
  const bestAnimatedNominees = nominations
    .filter(nom => nom.categoryId === bestAnimatedCategoryId)
    .map(nom => nom.movieId);

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

  const hiddenColumns = preferences.hiddenColumns.legacy;
  const hiddenUsers = preferences.hiddenUsers;

  //* If merge is false, the "isSelected" parameters should be null
  function makeSubTable(
    localMovies: Movie[],
    merge: boolean,
  ): React.ReactElement {
    if (localMovies.length === 0) {
      return <></>;
    }
    if (merge && localMovies.length > 5) {
      throw new Error(`Tried to merge too many rows: ${localMovies.length}`);
    }
    if (merge) {
      const total_runtime_minutes = localMovies.every(
        movie => movie['runtime_minutes'] !== null,
      )
        ? localMovies.reduce(
            (acc, movie) => acc + (movie['runtime_minutes'] ?? 0),
            0,
          )
        : null;
      const total_runtime_hours = total_runtime_minutes
        ? Math.floor(total_runtime_minutes / 60).toString() +
          ':' +
          (total_runtime_minutes % 60).toString().padStart(2, '0')
        : null;
      return (
        <TableRow
          key={localMovies.reduce((acc, movie) => acc + movie.id, '')}
          sx={
            {
              // backgroundColor: TABLE_ROW_COLOR,
            }
          }>
          <TableCell sx={{padding: 0}}>
            <Table>
              <TableBody>
                {localMovies.map((movie, index) => (
                  <TableRow key={movie.id + 'mini'}>
                    <TitleCell
                      movie={movie}
                      sx={{
                        borderBottom:
                          index === 4
                            ? 'none'
                            : '1px solid --mui-palette-text-primary',
                      }}
                    />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCell>
          <NominationsCell
            movieId={localMovies[0].id}
            nominations={nominations}
            categories={categories}
          />
          <RuntimeCell
            runtime_minutes={total_runtime_minutes}
            runtime_hours={total_runtime_hours}
            display_formatted={runtimeFormatted}
          />
          {sortedUsers.map(user => (
            <WatchlistCell
              key={user.id}
              userId={user.id}
              movieId={localMovies.map(movie => movie.id)}
            />
          ))}
        </TableRow>
      );
    }
    return (
      <>
        {localMovies.map((movie, index) => {
          return (
            <TableRow
              key={movie.id}
              sx={
                {
                  // backgroundColor: TABLE_ROW_COLOR,
                }
              }>
              <TitleCell
                movie={movie}
                bestPicNominees={bestPicNominees}
                bestAnimatedNominees={bestAnimatedNominees}
                preferences={preferences}
              />
              <NominationsCell
                movieId={movie.id}
                nominations={nominations}
                categories={categories}
              />
              <RuntimeCell
                runtime_minutes={movie['runtime_minutes']}
                runtime_hours={movie['runtime_hours']}
                display_formatted={runtimeFormatted}
              />
              {sortedUsers.map(user => (
                <WatchlistCell
                  key={user.id}
                  userId={user.id}
                  movieId={movie.id}
                />
              ))}
            </TableRow>
          );
        })}
      </>
    );
  }
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
            <ColumnLabel
              text="Film"
              sx={{maxWidth: '10ch', overflow: 'wrap'}}
            />
            <ColumnLabel text="Nominated For" />
            <ColumnLabel
              text="Runtime"
              onClick={() => setRuntimeFormatted(!runtimeFormatted)}
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
          {makeSubTable(sortedData, false)}
          {makeSubTable(sortedShortsLive, preferences.shortsAreOneFilm)}
          {makeSubTable(sortedShortsAnimated, preferences.shortsAreOneFilm)}
          {makeSubTable(sortedShortsDoc, preferences.shortsAreOneFilm)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Wrap the export with Suspense, ErrorBoundary
export default function LegacyTableWrapper() {
  const [filterState, setFilterState] = useState({
    watchstatus: [] as WatchStatus[],
    categories: [] as CategoryId[],
  });

  const {activeUserId} = useOscarAppContext();

  // Reset filterState when activeUserId changes
  useEffect(() => {
    setFilterState({
      watchstatus: [],
      categories: [],
    });
  }, [activeUserId]);

  return (
    <DefaultCatcher>
      <Box sx={{width: '100%', height: 'calc(100vh - 64px)'}}>
        <Stack
          direction="column"
          spacing={2}
          alignItems="center"
          // position="sticky"
          // top="-40px"
          // overflow="scroll"
        >
          <TableControls
            filterState={filterState}
            setFilterState={setFilterState}
          />
          <Paper
            sx={{
              width: '100%',
              flexGrow: 1,
              flexShrink: 1,
              height: 'calc(100vh - 64px)',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'sticky',
              top: 0,
            }}>
            <LegacyTable filterState={filterState} />
          </Paper>
        </Stack>
      </Box>
    </DefaultCatcher>
  );
}

function RuntimeCell({
  runtime_minutes,
  runtime_hours,
  display_formatted,
}: {
  runtime_minutes: number | null;
  runtime_hours: string | null;
  display_formatted: boolean;
}): React.ReactElement {
  return (
    <TableCell sx={{minWidth: 200, className: 'runtime-column'}} align="center">
      <Typography variant="h6">
        {display_formatted ? runtime_hours : runtime_minutes}
      </Typography>
    </TableCell>
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
