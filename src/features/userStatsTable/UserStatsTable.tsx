import {useSuspenseQueries, useSuspenseQuery} from '@tanstack/react-query';
import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  TableContainer,
  Stack,
} from '@mui/material';
import {
  movieOptions,
  userOptions,
  userStatsOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {UserStats} from '../../types/APIDataSchema';
import {
  NUM_SHORT_CATEGORIES,
  NUM_SHORT_FILMS_PER_CATEGORY,
} from '../../config/GlobalConstants';
import {getUsernameFromId, useSortUsers} from '../../utils/dataSelectors';
import {ColumnLabel} from '../../components/TableHeader';
import Countdown from '../../components/Countdown';
import {TABLE_ROW_COLOR} from '../../config/StyleChoices';

export default function UserStatsTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const [userStatsQ, usersQ, movieListQ] = useSuspenseQueries({
    queries: [userStatsOptions(year), userOptions(), movieOptions(year)],
  });
  const userStats = userStatsQ.data;
  const users = useSortUsers(usersQ.data);
  const movieList = movieListQ.data;
  const {shortsAreOneFilm} = useOscarAppContext().preferences;
  const numMoviesTotal = movieList.length;
  const numMoviesShort = NUM_SHORT_CATEGORIES * NUM_SHORT_FILMS_PER_CATEGORY;
  const numMoviesFeature = numMoviesTotal - numMoviesShort;
  const numMultinomTotal = movieList.filter(movie => movie.numNoms > 1).length;

  function makeFraction(
    numFeature: number,
    numShort: number,
    shortsAreOneFilm: boolean,
    onlyCountMultinom: boolean,
  ) {
    if (onlyCountMultinom) {
      return `${numFeature}/${numMultinomTotal}`;
    }
    const ratio = shortsAreOneFilm ? NUM_SHORT_FILMS_PER_CATEGORY : 1;
    const numerator = numFeature + numShort / ratio;
    const denominator = numMoviesFeature + numMoviesShort / ratio;
    return `${numerator}/${denominator}`;
  }

  // Define the stats columns configuration
  const statsColumns = [
    {
      title: 'Movies Seen',
      getValue: (user: UserStats) =>
        makeFraction(
          user.numSeenFeature ?? 0,
          user.numSeenShort ?? 0,
          shortsAreOneFilm,
          false,
        ),
    },
    {
      title: 'Movies Seen (planned)',
      getValue: (user: UserStats) =>
        makeFraction(
          (user.numTodoFeature ?? 0) + (user.numSeenFeature ?? 0),
          (user.numTodoShort ?? 0) + (user.numSeenShort ?? 0),
          shortsAreOneFilm,
          false,
        ),
    },
    {
      title: 'Multiple Nominations',
      getValue: (user: UserStats) =>
        makeFraction(user.numSeenMultinom ?? 0, 0, shortsAreOneFilm, true),
    },
    {
      title: 'Multiple Nominations (planned)',
      getValue: (user: UserStats) =>
        makeFraction(
          (user.numTodoMultinom ?? 0) + (user.numSeenMultinom ?? 0),
          0,
          shortsAreOneFilm,
          true,
        ),
    },
    {
      title: 'Total Watchtime Completed',
      getValue: (user: UserStats) => minutesToHours(user.seenWatchtime),
    },
    {
      title: 'Total Watchtime Remaining',
      getValue: (user: UserStats) => minutesToHours(user.todoWatchtime),
    },
  ];

  return (
    <Stack direction="column" spacing={2}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <ColumnLabel text="" />
              {statsColumns.map(column => (
                <ColumnLabel key={column.title} text={column.title} />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {userStats.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="h6">
                    {getUsernameFromId(user.id, users) ?? ''}
                  </Typography>
                </TableCell>
                {statsColumns.map(column => (
                  <TableCell key={column.title} align="center">
                    <Typography variant="h6">
                      {column.getValue(user)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Countdown />
    </Stack>
  );
}

function minutesToHours(minutes: number | null): string {
  if (minutes === null) {
    return '00:00';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${formatNumber(remainingMinutes)}`;
}

function formatNumber(number: number): string {
  return number.toString().padStart(2, '0');
}
