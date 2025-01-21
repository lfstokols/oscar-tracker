import React, {useState} from 'react';
import WatchlistCell from './WatchlistCell';
import {groupByShort, sortUsers} from '../../utils/dataSelectors';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Typography,
} from '@mui/material';
import DefaultCatcher from '../../components/LoadScreen';
import {ColumnLabel} from '../../components/TableHeader';
import {useSuspenseQueries} from '@tanstack/react-query';
import {useOscarAppContext} from '../../providers/AppContext';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
} from '../../hooks/dataOptions';
import NominationsCell from './NominationsCell';
import {CategoryIdSchema} from '../../types/APIDataSchema';
import {LogToConsole} from '../../utils/Logger';

function LegacyTable(): React.ReactElement {
  const {year, preferences} = useOscarAppContext();
  const [runtimeFormatted, setRuntimeFormatted] = useState(true);

  const [usersQ, nominationsQ, categoriesQ, moviesQ] = useSuspenseQueries({
    queries: [
      userOptions(),
      nomOptions(year),
      categoryOptions(),
      movieOptions(year),
    ],
  });
  const users = usersQ.data;
  const nominations = nominationsQ.data;
  const categories = categoriesQ.data;
  const movies = moviesQ.data;

  const {features, shortsAnimated, shortsLive, shortsDoc} = groupByShort(
    movies,
    nominations,
  );

  const bestPicCategoryId = CategoryIdSchema.parse('cat_pict');
  const bestPicNominees = nominations
    .filter(nom => nom.categoryId === bestPicCategoryId)
    .map(nom => nom.movieId);

  const sortedUsers = sortUsers(users);
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

  //* If merge is false, the "isSelected" parameters should be null
  function makeSubTable(
    localMovies: Movie[],
    merge: boolean,
    getsUpperBorder: boolean,
  ): React.ReactElement {
    if (merge && localMovies.length !== 5) {
      throw new Error('Tried to merge too many rows');
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
          sx={{
            backgroundColor: 'secondary.light',
            ...(getsUpperBorder
              ? {
                  borderTop: theme =>
                    `${theme.spacing(2)} solid rgba(0, 0, 0, 0.2)`,
                }
              : {}),
          }}>
          <TableCell>
            <Table>
              <TableBody>
                {localMovies.map(movie => (
                  <TableRow key={movie.id + 'mini'}>
                    <TitleCell movie={movie} />
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
              movieId={localMovies[0].id}
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
              sx={{
                backgroundColor: 'secondary.light',
                ...(getsUpperBorder && index === 0
                  ? {
                      borderTop: theme =>
                        `${theme.spacing(2)} solid rgba(0, 0, 0, 0.2)`,
                    }
                  : {}),
              }}>
              <TitleCell movie={movie} bestPicNominees={bestPicNominees} />
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
    <>
      {/* <style>{`
      .title-column {
        border: 5px solid #ccc;
      }
      .nominations-column {
        max-width: 300px;
      }
      .table-container {
        display: flex;
        flex-direction: column;
      }
      .scrollable-table {
        flex-grow: 1;
        overflow: auto;
        height: 100%;
        scrollbar-width: none; // Firefox 
        -ms-overflow-style: none;  // Internet Explorer 10+ 
      }
      .scrollable-table::-webkit-scrollbar { // WebKit
        display: none;
      }
    `}</style> */}
      <Paper
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          scrollbarWidth: '8px',
        }}>
        <TableContainer sx={{scrollBehavior: 'smooth'}}>
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
                />
                {sortedUsers.map(user => (
                  <ColumnLabel key={user.id} text={user.username} />
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {makeSubTable(sortedData, false, false)}
              {makeSubTable(
                sortedShortsLive,
                preferences.shortsAreOneFilm,
                true,
              )}
              {makeSubTable(
                sortedShortsAnimated,
                preferences.shortsAreOneFilm,
                true,
              )}
              {makeSubTable(
                sortedShortsDoc,
                preferences.shortsAreOneFilm,
                true,
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

// Wrap the export with Suspense, ErrorBoundary
export default function LegacyTableWrapper() {
  return (
    <DefaultCatcher>
      <LegacyTable />
    </DefaultCatcher>
  );
}

function TitleCell({
  movie,
  bestPicNominees,
}: {
  movie: Movie;
  bestPicNominees?: string[];
}): React.ReactElement {
  return (
    <TableCell
      title={movie.id}
      sx={{
        className: 'title-column',
        maxWidth: '30ch',
        overflow: 'auto',
        backgroundColor: bestPicNominees?.includes(movie.id)
          ? 'gold'
          : 'inherit',
        scrollbarWidth: 'none',
      }}>
      <b
        style={{
          fontSize: '1.2em',
          whiteSpace: 'nowrap',
        }}>
        {movie.mainTitle}
      </b>
      <br />
      {movie.subtitle ? (
        <i
          style={{
            fontSize: '0.8em',
            whiteSpace: 'nowrap',
            overflow: 'auto',
          }}>
          {movie.subtitle}
        </i>
      ) : null}
    </TableCell>
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
