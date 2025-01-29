import React from 'react';
import {useSuspenseQueries} from '@tanstack/react-query';
import {
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
} from '@mui/material';
import {
  categoryCompletionOptions,
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {useSortUsers, catssByGrouping} from '../../utils/dataSelectors';
import {useOscarAppContext} from '../../providers/AppContext';
import {Grouping} from '../../types/Enums';
import {Hypotheticality} from '../userStatsTable/Enums';
import GroupingRow from './GroupingRow';
import CategoryRow from './CategoryRow';
import {TableHeaderCell} from '../../components/TableHeader';
export default function CategoryCompletionTable({
  hypotheticality,
}: {
  hypotheticality: Hypotheticality;
}): React.ReactElement {
  const {year} = useOscarAppContext();
  const [mainDataQ, usersQ, nominationsQ, categoriesQ, moviesQ, watchlistQ] =
    useSuspenseQueries({
      queries: [
        categoryCompletionOptions(year),
        userOptions(),
        nomOptions(year),
        categoryOptions(),
        movieOptions(year),
        watchlistOptions(year),
      ],
    });
  const userList = useSortUsers(usersQ.data);
  const data = mainDataQ.data;
  const watchlist = watchlistQ.data;
  const movies = moviesQ.data;
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;

  const groupingDict = catssByGrouping(categories);
  const groupingList = Object.values(Grouping);

  const [areOpen, setAreOpen] = React.useState<Record<Grouping, boolean>>(
    Object.values(Grouping).reduce((acc, grouping) => {
      acc[grouping] = false;
      return acc;
    }, {} as Record<Grouping, boolean>),
  );

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
            <TableHeaderCell width="50px" text="" />
            <TableHeaderCell width="300px" text="Category" />
            {userList.map(user => (
              <TableHeaderCell key={user.id} text={user.username} />
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groupingList.map(grouping => {
            const isExpanded = areOpen[grouping];
            return (
              <React.Fragment key={grouping}>
                <GroupingRow
                  grouping={grouping}
                  isExpanded={isExpanded}
                  handleToggle={() =>
                    setAreOpen(prev => toggleOpenness(prev, grouping))
                  }
                  data={data}
                  hypotheticality={hypotheticality}
                  userList={userList.map(user => user.id)}
                />
                {groupingDict[grouping].map(cat => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    isOpen={isExpanded}
                    data={data}
                    hypotheticality={hypotheticality}
                    userList={userList.map(user => user.id)}
                    nominations={nominations}
                    watchlist={watchlist}
                    movies={movies}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function toggleOpenness(
  prev: Record<Grouping, boolean>,
  grouping: Grouping,
): Record<Grouping, boolean> {
  return {...prev, [grouping]: !prev[grouping]};
}
