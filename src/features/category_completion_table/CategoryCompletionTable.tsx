import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import * as React from 'react';
import {Dispatch, SetStateAction} from 'react';
import {TableHeaderCell} from '../../components/TableHeader';
import {
  categoryCompletionOptions,
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {Grouping} from '../../types/Enums';
import {catssByGrouping, useSortUsers} from '../../utils/dataSelectors';
import {Hypotheticality} from '../userStatsTable/Enums';
import CategoryRow from './CategoryRow';
import GroupingRow from './GroupingRow';
import {toggleOpenness} from './toggleOpenness';
export default function CategoryCompletionTable({
  hypotheticality,
  areOpen,
  setAreOpen,
}: {
  areOpen: Record<Grouping, boolean>;
  setAreOpen: Dispatch<SetStateAction<Record<Grouping, boolean>>>;
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
            <TableHeaderCell text="" width="50px" />
            <TableHeaderCell text="Category" width="300px" />
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
                  data={data}
                  grouping={grouping}
                  handleToggle={() =>
                    setAreOpen(prev => toggleOpenness(prev, grouping))
                  }
                  hypotheticality={hypotheticality}
                  isExpanded={isExpanded}
                  userList={userList.map(user => user.id)}
                />
                {groupingDict[grouping].map(cat => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    data={data}
                    hypotheticality={hypotheticality}
                    isOpen={isExpanded}
                    movies={movies}
                    nominations={nominations}
                    userList={userList.map(user => user.id)}
                    watchlist={watchlist}
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
