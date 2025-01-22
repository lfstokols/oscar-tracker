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
import {getUsernameFromId, sortUsers} from '../../utils/dataSelectors';
import {ColumnLabel} from '../../components/TableHeader';
import Countdown from '../../components/Countdown';
import {TABLE_ROW_COLOR} from '../../config/StyleChoices';

export default function UserStatsTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const [userStatsQ, usersQ, movieListQ] = useSuspenseQueries({
    queries: [userStatsOptions(year), userOptions(), movieOptions(year)],
  });
  const userStats = userStatsQ.data;
  const users = sortUsers(usersQ.data);
  const movieList = movieListQ.data;
  const {shortsAreOneFilm} = useOscarAppContext().preferences;
  const numMoviesTotal = movieList.length;
  const numMoviesShort = NUM_SHORT_CATEGORIES * NUM_SHORT_FILMS_PER_CATEGORY;
  const numMoviesFeature = numMoviesTotal - numMoviesShort;
  const numMultinomTotal = movieList.filter(movie => movie.numNoms > 1).length;

  function makeRow(title: string, values: (user: UserStats) => string) {
    return (
      <TableRow key={title} sx={{backgroundColor: TABLE_ROW_COLOR}}>
        <TableCell>
          <Typography variant="h6">{title}</Typography>
        </TableCell>
        {userStats.map(user => (
          <TableCell key={user.id} align="center">
            <Typography variant="h6">{values(user)}</Typography>
          </TableCell>
        ))}
      </TableRow>
    );
  }

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

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <ColumnLabel text="" />
              {userStats.map(user => (
                <ColumnLabel
                  key={user.id}
                  text={getUsernameFromId(user.id, users) ?? ''}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {makeRow('Movies Seen', user =>
              makeFraction(
                user.numSeenFeature ?? 0,
                user.numSeenShort ?? 0,
                shortsAreOneFilm,
                false,
              ),
            )}
            {makeRow('Movies Seen (planned)', user =>
              makeFraction(
                (user.numTodoFeature ?? 0) + (user.numSeenFeature ?? 0),
                (user.numTodoShort ?? 0) + (user.numSeenShort ?? 0),
                shortsAreOneFilm,
                false,
              ),
            )}
            {makeRow('Multiple Nominations', user =>
              makeFraction(
                user.numSeenMultinom ?? 0,
                0,
                shortsAreOneFilm,
                true,
              ),
            )}
            {makeRow('Multiple Nominations (planned)', user =>
              makeFraction(
                (user.numTodoMultinom ?? 0) + (user.numSeenMultinom ?? 0),
                0,
                shortsAreOneFilm,
                true,
              ),
            )}
            {makeRow('Total Watchtime Completed', user =>
              minutesToHours(user.seenWatchtime),
            )}
            {makeRow('Total Watchtime Remaining', user =>
              minutesToHours(user.todoWatchtime),
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Countdown />
    </>
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
