import {useSuspenseQuery} from '@tanstack/react-query';
import React from 'react';
import {Table, TableHead, TableRow, TableCell, TableBody} from '@mui/material';
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
import {getUsernameFromId} from '../../utils/dataSelectors';
export default function UserStatsTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const userStats = useSuspenseQuery(userStatsOptions(year)).data;
  const users = useSuspenseQuery(userOptions()).data;
  const movieList = useSuspenseQuery(movieOptions(year)).data;
  const {shortsAreOneFilm} = useOscarAppContext().preferences;
  const numMoviesTotal = movieList.length;
  const numMoviesShort = NUM_SHORT_CATEGORIES * NUM_SHORT_FILMS_PER_CATEGORY;
  const numMoviesFeature = numMoviesTotal - numMoviesShort;
  const numMultinomTotal = movieList.filter(movie => movie.numNoms > 1).length;

  function makeRow(title: string, values: (user: UserStats) => string) {
    return (
      <TableRow key={title}>
        <TableCell>{title}</TableCell>
        {userStats.map(user => (
          <TableCell key={user.id}>{values(user)}</TableCell>
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
    <Table>
      <TableHead>
        <TableRow>
          <TableCell />
          {userStats.map(user => (
            <TableCell key={user.id}>
              {getUsernameFromId(user.id, users)}
            </TableCell>
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
          makeFraction(user.numSeenMultinom ?? 0, 0, shortsAreOneFilm, true),
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
