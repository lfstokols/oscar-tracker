import {useSuspenseQueries} from '@tanstack/react-query';
import React, {useState} from 'react';
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
import {getUsernameFromId} from '../../utils/dataSelectors';
import {TableHeaderCell} from '../../components/TableHeader';
// import {TODO_COLOR} from '../../config/StyleChoices';
import {totalNumberOfCategories} from '../../utils/hardcodedFunctions';
import TableSortLabel from '@mui/material/TableSortLabel';
import {Hypotheticality, ColumnLabels} from './Enums';
// import {useIsMobile} from '../../hooks/useIsMobile';

type UserStatsExtended = UserStats & {numCatsDone: number; numCatsTodo: number};

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

  function numFeature(user: UserStatsExtended) {
    return (
      (includeSeen ? user.numSeenFeature ?? 0 : 0) +
      (includeTodo ? user.numTodoFeature ?? 0 : 0)
    );
  }

  function numShort(user: UserStatsExtended) {
    return (
      (includeSeen ? user.numSeenShort ?? 0 : 0) +
      (includeTodo ? user.numTodoShort ?? 0 : 0)
    );
  }

  function numMultinom(user: UserStatsExtended) {
    return (
      (includeSeen ? user.numSeenMultinom ?? 0 : 0) +
      (includeTodo ? user.numTodoMultinom ?? 0 : 0)
    );
  }
  function numCats(user: UserStatsExtended) {
    return (
      (includeSeen ? user.numCatsDone ?? 0 : 0) +
      (includeTodo ? user.numCatsTodo ?? 0 : 0)
    );
  }

  // Define the stats columns configuration
  const statsColumns: {
    title: string;
    label: ColumnLabels;
    getValue: (user: UserStatsExtended) => {number: number; display: string};
  }[] = [
    {
      title: 'Total Movies',
      label: ColumnLabels.TOTAL_MOVIES,
      getValue: (user: UserStatsExtended) =>
        makeFraction(numFeature(user), numShort(user), shortsAreOneFilm, false),
    },
    {
      title: 'Multi-Nom Movies',
      label: ColumnLabels.MULTINOM,
      getValue: (user: UserStatsExtended) =>
        makeFraction(numMultinom(user), 0, shortsAreOneFilm, true),
    },
    {
      title: 'Complete Categories',
      label: ColumnLabels.COMPLETE_CATEGORIES,
      getValue: (user: UserStatsExtended) =>
        makeFraction_categories(numCats(user)),
    },
    {
      title: 'Total Watchtime',
      label: ColumnLabels.WATCHTIME,
      getValue: (user: UserStatsExtended) => ({
        number:
          (includeSeen ? user.seenWatchtime ?? 0 : 0) +
          (includeTodo ? user.todoWatchtime ?? 0 : 0),
        display: minutesToHours(
          (includeSeen ? user.seenWatchtime ?? 0 : 0) +
            (includeTodo ? user.todoWatchtime ?? 0 : 0),
        ),
      }),
    },
  ];

  const sortedUserList = userStatsExtended.sort((a, b) => {
    return (
      statsColumns[sortByIndex].getValue(b).number -
      statsColumns[sortByIndex].getValue(a).number
    );
  });

  return (
    // <Stack
    //   direction="column"
    //   spacing={3}
    //   sx={{
    //     height: '100%',
    //   }}
    //   alignItems="center">
    <>
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
                checkDisabledCombination(column.label, hypotheticality) ? (
                  <></>
                ) : (
                  <TableHeaderCell
                    text={column.title}
                    key={column.label}
                    icon={
                      <TableSortLabel
                        onClick={() => setSortByIndex(index)}
                        direction="asc"
                        active={sortByIndex === index}
                        sx={{
                          padding: 0,
                          position: 'absolute',
                          left: '95%',
                        }}
                        // hideSortIcon={true}
                      />
                    }
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
                  checkDisabledCombination(column.label, hypotheticality) ? (
                    <React.Fragment key={column.label}></React.Fragment>
                  ) : (
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

function enumToBool(value: Hypotheticality): {
  includeSeen: boolean;
  includeTodo: boolean;
} {
  if (value === Hypotheticality.SEEN) {
    return {includeSeen: true, includeTodo: false};
  }
  if (value === Hypotheticality.TODO) {
    return {includeSeen: false, includeTodo: true};
  }
  return {includeSeen: true, includeTodo: true};
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
