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
  SxProps,
  Theme,
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
import {
  BEST_PICTURE_COLOR,
  HIGHLIGHT_ANIMATED_COLOR,
  TABLE_ROW_COLOR,
} from '../../config/StyleChoices';
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
  const bestAnimatedCategoryId = CategoryIdSchema.parse('cat_anim');
  const bestAnimatedNominees = nominations
    .filter(nom => nom.categoryId === bestAnimatedCategoryId)
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
    <Paper
      sx={{
        marginTop: '16px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        scrollbarHeight: '8px',
        // backgroundColor: 'secondary.light',
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
          <TableBody sx={{borderRadius: 5}}>
            {makeSubTable(sortedData, false)}
            {makeSubTable(sortedShortsLive, preferences.shortsAreOneFilm)}
            {makeSubTable(sortedShortsAnimated, preferences.shortsAreOneFilm)}
            {makeSubTable(sortedShortsDoc, preferences.shortsAreOneFilm)}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
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
  bestAnimatedNominees,
  preferences,
  sx: sxProps,
  ...props
}: {
  movie: Movie;
  bestPicNominees?: string[];
  bestAnimatedNominees?: string[];
  preferences?: Preferences;
  sx?: SxProps<Theme>;
  props?: Record<string, unknown>;
}): React.ReactElement {
  //*----------------------
  const y_radius = 15;
  const x_radius = getTextWidth(movie.mainTitle) * 0.7;
  const ratio = 1.5;
  const diff = 10;
  const upper_angles = Array(6)
    .fill(0)
    .map((_, i) => (5 * Math.PI) / 4 + (i / 5) * (Math.PI / 2));
  const angles = [
    ...Array(6)
      .fill(0)
      .map((_, i) => Math.PI / 4 + (i / 5) * (Math.PI / 2)),
    ...upper_angles,
  ];
  //*----------------------

  return (
    <TableCell
      title={movie.id}
      sx={{
        textAlign: 'center',
        className: 'title-column',
        maxWidth: '30ch',
        overflow: 'visible',
        scrollbarWidth: 'none',
        position: 'relative',
        ...sxProps,
      }}
      {...props}>
      {bestPicNominees?.includes(movie.id) && (
        <svg
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '0%',
            left: '0%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
          viewBox="0 0 150 100">
          {angles.map((angle, i) => {
            const innerX = 75 + x_radius * Math.cos(angle); // Wider x radius
            const innerY = 50 + y_radius * Math.sin(angle); // Shorter y radius
            const outerX = 75 + (x_radius + diff) * Math.cos(angle); // Wider x radius
            const outerY = 50 + (y_radius + diff) * Math.sin(angle); // Shorter y radius
            return (
              <line
                key={i}
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="rgba(255,215,0,0.6)"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      )}
      <div
        style={
          preferences?.highlightAnimated &&
          bestAnimatedNominees?.includes(movie.id)
            ? {
                border: `1px dashed ${HIGHLIGHT_ANIMATED_COLOR}`,
                padding: '8px',
                borderRadius: '30px',
              }
            : {}
        }>
        <b
          style={{
            fontSize: '1.2em',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
            color: bestPicNominees?.includes(movie.id)
              ? BEST_PICTURE_COLOR
              : preferences?.highlightAnimated &&
                bestAnimatedNominees?.includes(movie.id)
              ? HIGHLIGHT_ANIMATED_COLOR
              : 'inherit',
            // backgroundColor: bestPicNominees?.includes(movie.id)
            //   ? BEST_PICTURE_COLOR
            //   : preferences?.highlightAnimated &&
            //     bestAnimatedNominees?.includes(movie.id)
            //   ? HIGHLIGHT_ANIMATED_COLOR
            //   : 'inherit',
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
              position: 'relative',
              zIndex: 1,
            }}>
            {movie.subtitle}
          </i>
        ) : null}
      </div>
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

function getTextWidth(text: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = 'Roboto, sans-serif';
  return context.measureText(text).width;
}
