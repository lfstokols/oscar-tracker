import {useSuspenseQueries, useSuspenseQuery} from '@tanstack/react-query';
import React, {useState} from 'react';
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
  categoryCompletionOptions,
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
import {TABLE_ROW_COLOR, TODO_COLOR} from '../../config/StyleChoices';
import {totalNumberOfCategories} from '../../utils/hardcodedFunctions';
import ClickableSortIcon from './ClickableSortIcon';
import TableSortLabel from '@mui/material/TableSortLabel';

type UserStatsExtended = UserStats & {numCatsDone: number; numCatsTodo: number};

export default function UserStatsTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const [userStatsQ, usersQ, movieListQ, categoryCompletionQ] =
    useSuspenseQueries({
      queries: [
        userStatsOptions(year),
        userOptions(),
        movieOptions(year),
        categoryCompletionOptions(year),
      ],
    });
  const userStats = userStatsQ.data;
  const users = sortUsers(usersQ.data, userStats);
  const movieList = movieListQ.data;
  const categoryCompletion: Record<UserId, {numCats: number}[]> =
    categoryCompletionQ.data;
  const {shortsAreOneFilm} = useOscarAppContext().preferences;
  const numMoviesTotal = movieList.length;
  const numMoviesShort = NUM_SHORT_CATEGORIES * NUM_SHORT_FILMS_PER_CATEGORY;
  const numMoviesFeature = numMoviesTotal - numMoviesShort;
  const numMultinomTotal = movieList.filter(movie => movie.numNoms > 1).length;
  const [sortByIndex, setSortByIndex] = useState(0);

  const userStatsExtended = userStats.map(
    (user_data: UserStats): UserStatsExtended => {
      return {
        ...user_data,
        numCatsDone: categoryCompletion[user_data.id][0].numCats,
        numCatsTodo: categoryCompletion[user_data.id][1].numCats,
      };
    },
  );

  function makeFraction(
    numFeature: number,
    numShort: number,
    shortsAreOneFilm: boolean,
    onlyCountMultinom: boolean,
  ) {
    if (onlyCountMultinom) {
      return makeFraction_display(numFeature, numMultinomTotal);
    }
    const ratio = shortsAreOneFilm ? NUM_SHORT_FILMS_PER_CATEGORY : 1;
    const numerator = numFeature + numShort / ratio;
    const denominator = numMoviesFeature + numMoviesShort / ratio;
    return makeFraction_display(numerator, denominator);
  }

  function makeFraction_categories(numerator: number) {
    return makeFraction_display(numerator, totalNumberOfCategories);
  }

  function makeFraction_display(numerator: number, denominator: number) {
    return {number: numerator, display: `${numerator}/${denominator}`};
  }

  // Define the stats columns configuration
  const statsColumns: {
    title: string;
    planned: boolean;
    watchtime: boolean;
    getValue: (user: UserStatsExtended) => {number: number; display: string};
  }[] = [
    {
      title: 'Movies Seen',
      planned: false,
      watchtime: false,
      getValue: (user: UserStatsExtended) =>
        makeFraction(
          user.numSeenFeature ?? 0,
          user.numSeenShort ?? 0,
          shortsAreOneFilm,
          false,
        ),
    },
    {
      title: 'Movies Seen',
      planned: true,
      watchtime: false,
      getValue: (user: UserStatsExtended) =>
        makeFraction(
          (user.numTodoFeature ?? 0) + (user.numSeenFeature ?? 0),
          (user.numTodoShort ?? 0) + (user.numSeenShort ?? 0),
          shortsAreOneFilm,
          false,
        ),
    },
    {
      title: 'Multiple Noms',
      planned: false,
      watchtime: false,
      getValue: (user: UserStatsExtended) =>
        makeFraction(user.numSeenMultinom ?? 0, 0, shortsAreOneFilm, true),
    },
    {
      title: 'Multiple Noms',
      planned: true,
      watchtime: false,
      getValue: (user: UserStatsExtended) =>
        makeFraction(
          (user.numTodoMultinom ?? 0) + (user.numSeenMultinom ?? 0),
          0,
          shortsAreOneFilm,
          true,
        ),
    },
    {
      title: 'Categories Completed',
      planned: false,
      watchtime: false,
      getValue: (user: UserStatsExtended) =>
        makeFraction_categories(user.numCatsDone ?? '??'),
    },
    {
      title: 'Categories Completed',
      planned: true,
      watchtime: false,
      getValue: (user: UserStatsExtended) =>
        makeFraction_categories(user.numCatsTodo ?? '??'),
    },
    {
      title: 'Total Watchtime',
      planned: false,
      watchtime: true,
      getValue: (user: UserStatsExtended) => ({
        number: user.seenWatchtime ?? 0,
        display: minutesToHours(user.seenWatchtime ?? 0),
      }),
    },
    {
      title: 'Total Watchtime',
      planned: true,
      watchtime: true,
      getValue: (user: UserStatsExtended) => ({
        number: user.todoWatchtime ?? 0,
        display: minutesToHours(user.todoWatchtime ?? 0),
      }),
    },
  ];

  const sortedUserList = userStatsExtended.sort((a, b) => {
    return (
      statsColumns[sortByIndex].getValue(b).number -
      statsColumns[sortByIndex].getValue(a).number
    );
  });

  function makeButtonProps(index: number) {
    return {
      isSelected: sortByIndex === index,
      onSelect: () => setSortByIndex(index),
    };
  }

  return (
    <Stack direction="column" spacing={2}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <ColumnLabel text="" />
              {statsColumns.map((column, index) => (
                <ColoredColumnHeader
                  key={column.title}
                  title={column.title}
                  planned={column.planned}
                  watchtime={column.watchtime}
                  icon={
                    <TableSortLabel
                      onClick={() => setSortByIndex(index)}
                      direction="asc"
                      active={sortByIndex === index}
                      sx={{
                        padding: 0,
                      }}
                    />
                  }
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUserList.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="h6">
                    {getUsernameFromId(user.id, users) ?? ''}
                  </Typography>
                </TableCell>
                {statsColumns.map(column => (
                  <TableCell key={column.title + column.planned} align="center">
                    <Typography variant="h6">
                      {column.getValue(user).display}
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

function ColoredColumnHeader({
  title,
  planned,
  watchtime,
  icon,
}: {
  title: string;
  planned: boolean;
  watchtime: boolean;
  icon?: React.ReactElement;
}): React.ReactElement {
  const subtext = watchtime
    ? planned
      ? 'remaining'
      : 'completed'
    : planned
    ? 'planned'
    : undefined;
  return (
    <ColumnLabel
      text={title}
      subtext={subtext}
      sx={{
        color: planned ? TODO_COLOR : 'inherit',
      }}
      icon={icon}
    />
  );
}

function sortUsers(users: User[], userStats: UserStats[]): User[] {
  return users.sort((a, b) => {
    const aStats = userStats.find(user => user.id === a.id);
    const bStats = userStats.find(user => user.id === b.id);
    return (bStats?.numSeenFeature ?? 0) - (aStats?.numSeenFeature ?? 0);
  });
}
