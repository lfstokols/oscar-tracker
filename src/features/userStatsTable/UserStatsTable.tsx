import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';
import {useSuspenseQueries} from '@tanstack/react-query';
import * as React from 'react';
import {useState} from 'react';
import {TableHeaderCell} from '../../components/TableHeader';
import {
  NUM_SHORT_CATEGORIES,
  NUM_SHORT_FILMS_PER_CATEGORY,
} from '../../config/GlobalConstants';
import {
  movieOptions,
  userOptions,
  userStatsOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {UserStats} from '../../types/APIDataSchema';
import {getUsernameFromId} from '../../utils/dataSelectors';
// import {TODO_COLOR} from '../../config/StyleChoices';
import {TOTAL_CATEGORY_COUNT} from '../../utils/hardcodedFunctions';
import {enumToBool} from '../category_completion_table/utils';
import {ColumnLabels, Hypotheticality} from './Enums';
// import {useIsMobile} from '../../hooks/useIsMobile';

const disabledCombinations: {
  column_label: ColumnLabels;
  hypotheticality: Hypotheticality;
}[] = [
  {
    column_label: ColumnLabels.COMPLETE_CATEGORIES,
    hypotheticality: Hypotheticality.TODO,
  },
];

export default function UserStatsTable({
  hypotheticality,
}: {
  hypotheticality: Hypotheticality;
}): React.ReactElement {
  const {
    year,
    preferences: {shortsAreOneFilm},
  } = useOscarAppContext();
  const [userStatsQ, usersQ, movieListQ] = useSuspenseQueries({
    queries: [userStatsOptions(year), userOptions(), movieOptions(year)],
  });
  const userStats = userStatsQ.data;
  const users = sortUsers(usersQ.data, userStats);
  const movieList = movieListQ.data;
  const numMoviesTotal = movieList.length;
  const numMoviesShort = NUM_SHORT_CATEGORIES * NUM_SHORT_FILMS_PER_CATEGORY;
  const numMoviesFeature = numMoviesTotal - numMoviesShort;
  const numMultinomTotal = movieList.filter(movie => movie.numNoms > 1).length;
  // const isMobile = useIsMobile();
  const [sortByIndex, setSortByIndex] = useState(0);

  if (checkDisabledCombination(sortByIndex, hypotheticality)) {
    for (let index = 0; index < 100; index++) {
      if (!checkDisabledCombination(index, hypotheticality)) {
        setSortByIndex(index);
        break;
      }
      console.error('No valid columns for this hypotheticality');
      throw new Error('No valid columns for this hypotheticality');
    }
  }
  const {includeSeen, includeTodo} = enumToBool(hypotheticality);

  function numFeature(user: UserStats) {
    return (
      (includeSeen ? user.numSeenFeature ?? 0 : 0) +
      (includeTodo ? user.numTodoFeature ?? 0 : 0)
    );
  }

  function numShort(user: UserStats) {
    return (
      (includeSeen ? user.numSeenShort ?? 0 : 0) +
      (includeTodo ? user.numTodoShort ?? 0 : 0)
    );
  }

  function numMultinom(user: UserStats) {
    return (
      (includeSeen ? user.numSeenMultinom ?? 0 : 0) +
      (includeTodo ? user.numTodoMultinom ?? 0 : 0)
    );
  }

  function watchtime(user: UserStats) {
    return (
      (includeSeen ? user.seenWatchtime ?? 0 : 0) +
      (includeTodo ? user.todoWatchtime ?? 0 : 0)
    );
  }

  const fractionValues = {numMultinomTotal, numMoviesFeature, numMoviesShort};

  // Define the stats columns configuration
  const statsColumns: {
    title: string;
    label: ColumnLabels;
    getValue: (user: UserStats) => {number: number; display: string};
  }[] = [
    {
      title: 'Total Movies',
      label: ColumnLabels.TOTAL_MOVIES,
      getValue: (user: UserStats) =>
        makeFraction(
          numFeature(user),
          numShort(user),
          shortsAreOneFilm,
          false,
          fractionValues,
        ),
    },
    {
      title: 'Multi-Nom Movies',
      label: ColumnLabels.MULTINOM,
      getValue: (user: UserStats) =>
        makeFraction(
          numMultinom(user),
          0,
          shortsAreOneFilm,
          true,
          fractionValues,
        ),
    },
    {
      title: 'Complete Categories',
      label: ColumnLabels.COMPLETE_CATEGORIES,
      getValue: (user: UserStats) =>
        makeFraction_categories(numCats(user, hypotheticality)),
    },
    {
      title: 'Total Watchtime',
      label: ColumnLabels.WATCHTIME,
      getValue: (user: UserStats) => ({
        number: watchtime(user),
        display: minutesToHours(watchtime(user)),
      }),
    },
  ];

  const sortedUserList = userStats.sort((a, b) => {
    return (
      statsColumns[sortByIndex].getValue(b).number -
      statsColumns[sortByIndex].getValue(a).number
    );
  });

  return (
    <TableContainer
      sx={{
        backgroundImage: 'var(--mui-overlays-1)',
        paddingBottom: 2,
        borderRadius: '5px',
      }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell key="rank" />
            <TableHeaderCell key="username" />
            {statsColumns.map((column, index) =>
              checkDisabledCombination(column.label, hypotheticality) ? null : (
                <TableHeaderCell
                  key={column.label}
                  icon={
                    <TableSortLabel
                      active={sortByIndex === index}
                      direction="asc"
                      onClick={() => setSortByIndex(index)}
                      sx={{
                        padding: 0,
                        position: 'absolute',
                        left: '95%',
                      }}
                      // hideSortIcon={true}
                    />
                  }
                  text={column.title}
                />
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedUserList.map((user, index) => (
            <TableRow key={user.id}>
              <TableCell key="rank">
                <Typography variant="h6">{index + 1}</Typography>
              </TableCell>
              <TableCell key="username">
                <Typography variant="h6">
                  {getUsernameFromId(user.id, users) ?? ''}
                </Typography>
              </TableCell>
              {statsColumns.map(column =>
                checkDisabledCombination(
                  column.label,
                  hypotheticality,
                ) ? null : (
                  <TableCell key={column.label} align="center">
                    <Typography variant="h6">
                      {column.getValue(user).display}
                    </Typography>
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function numCats(user: UserStats, hypotheticality: Hypotheticality) {
  const normalizedSeen = user.numCatsSeen ?? 0;
  const normalizedTodo = user.numCatsTodo ?? 0;
  if (hypotheticality === Hypotheticality.SEEN) {
    return normalizedSeen;
  }
  if (hypotheticality === Hypotheticality.BOTH) {
    return normalizedTodo;
  }
  return 0;
}

function makeFraction(
  numFeature: number,
  numShort: number,
  shortsAreOneFilm: boolean,
  onlyCountMultinom: boolean,
  {
    numMultinomTotal,
    numMoviesFeature,
    numMoviesShort,
  }: {
    numMultinomTotal: number;
    numMoviesFeature: number;
    numMoviesShort: number;
  },
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
  return makeFraction_display(numerator, TOTAL_CATEGORY_COUNT);
}

function makeFraction_display(numerator: number, denominator: number) {
  return {number: numerator, display: `${numerator}/${denominator}`};
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

// function ColoredColumnHeader({
//   title,
//   planned,
//   watchtime,
//   icon,
// }: {
//   title: string;
//   planned: boolean;
//   watchtime: boolean;
//   icon?: React.ReactElement;
// }): React.ReactElement {
//   const subtext = watchtime
//     ? planned
//       ? 'remaining'
//       : 'completed'
//     : planned
//     ? 'planned'
//     : undefined;
//   return (
//     <TableHeaderCell
//       text={title}
//       // subtext={subtext}
//       sx={{
//         color: planned ? TODO_COLOR : 'inherit',
//       }}
//       icon={icon}
//     />
//   );
// }

function sortUsers(users: User[], userStats: UserStats[]): User[] {
  return users.sort((a, b) => {
    const aStats = userStats.find(user => user.id === a.id);
    const bStats = userStats.find(user => user.id === b.id);
    return (bStats?.numSeenFeature ?? 0) - (aStats?.numSeenFeature ?? 0);
  });
}

function checkDisabledCombination(
  column_label: ColumnLabels,
  hypotheticality: Hypotheticality,
): boolean {
  return disabledCombinations.some(
    combo =>
      combo.column_label === column_label &&
      combo.hypotheticality === hypotheticality,
  );
}
