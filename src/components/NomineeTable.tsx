import React, {Suspense, useContext, useState} from 'react';
import {WatchFilter} from '../App';
import WatchlistCell from './WatchlistCell';
import useData from '../hooks/useData';
import {
  getNominationCategoriesForMovie,
  getMovieWatchStatusForUser,
} from '../utils/dataSelectors';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
} from '@mui/material';
import {DataFlavor, WatchStatus} from '../types/Enums';
import {LoadScreen} from '../App';
import {
  QueryErrorResetBoundary,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {useOscarAppContext} from '../contexts/AppContext';
import {useMyQuery} from '../hooks/useMyQuery';
import useUsers from '../hooks/useUsers';
import useNominations from '../hooks/useNominations';
import useCategories from '../hooks/useCategories';
import useWatchlist from '../hooks/useWatchlist';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../hooks/dataOptions';
//const TEST_DATA = '{ "users": [{ "username": "Logan", "watchedMovies": ["Oppenheimer"] }], "movies": [ { "title": "Oppenheimer", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Poor Things", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Killers of the Flower Moon", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Barbie", "nominations": [ "Best Picture", "Actor", "Actress" ] } ] }';

//export type Row = {
//  title: string;
//  title_tooltip: string;
//  categories: string;
//};
//
//function getRowInfo(
//  movie: Movie,
//  nominations: Nom[],
//  users: User[],
//  watchlist: WatchNotice[],
//  categories: Category[],
//): Row {
//  // Get nomination list for this movie
//  const nomList = getNominationCategoriesForMovie(
//    movie.id,
//    nominations,
//    categories,
//  )
//    .map(nom => nom.shortName)
//    .join(', ');
//
//  // get watch status for each user
//  const watchStatuses = users.reduce(
//    (acc: Record<string, WatchStatus>, user: User) => {
//      acc[user.username] = getMovieWatchStatusForUser(
//        user.id,
//        movie.id,
//        watchlist,
//      );
//      return acc;
//    },
//    {},
//  );
//  const row: Row = {
//    title: movie.title,
//    title_tooltip: movie.id,
//    categories: nomList,
//    ...watchStatuses,
//  };
//
//  return row;
//}

function NomineeTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  //const [orderBy, setOrderBy] = useState<keyof Row>('title');
  //const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  //const {isPending, isError, allData, isFetching} = useData(year);
  const users: User[] = useSuspenseQuery(userOptions()).data;
  const nominations: Nom[] = useSuspenseQuery(nomOptions(year)).data;
  const categories: Category[] = useSuspenseQuery(categoryOptions()).data;
  const watchlist: WatchNotice[] = useSuspenseQuery(
    watchlistOptions(year),
  ).data;
  const movies: Movie[] = useSuspenseQuery(movieOptions(year)).data;
  //const users = usersPromise.data ?? [];
  //const nominations = nominationsPromise.data ?? [];
  //const categories = categoriesPromise.data ?? [];
  //const watchlist = watchlistPromise.data ?? [];
  //const movies = moviesPromise.data ?? [];
  //const tableData = moviesPromise.data?.map((movie: Movie) => {
  //  if (!nominations || !users || !watchlist || !categories) {
  //    return undefined;
  //  }
  //  return getRowInfo(movie, nominations, users, watchlist, categories);
  //});

  const sortedData = movies.sort((a, b) => (a.numNoms > b.numNoms ? -1 : 1));
  //  React.useMemo(() => {
  //    if (!tableData || tableData.some(item => item === undefined)) {
  //      return undefined;
  //    }
  //    return [...(tableData as Row[])].sort((a, b) => {
  //      const orderingAttr =
  //        orderBy === 'categories'
  //|          ? (str: string) => str.length
  //          : (str: string) => str;
  //
  //      if (order === 'asc') {
  //        return orderingAttr(a[orderBy]) < orderingAttr(b[orderBy]) ? -1 : 1;
  //      } else {
  //        return orderingAttr(b[orderBy]) < orderingAttr(a[orderBy]) ? -1 : 1;
  //      }
  //    });
  //  }, [tableData, order, orderBy]);

  //if (isPending) return <LoadScreen />;
  //if (isError) return <div>Error fetching data :</div>;

  //if (
  //  !users ||
  //  !movies ||
  //  !nominations ||
  //  !categories ||
  //  !watchlist ||
  //  !tableData ||
  //  !sortedData
  //)
  //  return <div>No data available</div>;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  //const handleSort = (property: keyof Row) => {
  //  const isAsc = orderBy === property && order === 'asc';
  //  setOrder(isAsc ? 'desc' : 'asc');
  //  setOrderBy(property);
  //};

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper sx={{width: '100%', overflow: 'hidden'}}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{minWidth: 200}}>Film</TableCell>
              <TableCell sx={{minWidth: 200}}>Nominated For</TableCell>
              {users.map(user => (
                <TableCell key={user.id} align="center">
                  {user.username}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={paginatedData[index].title} hover>
                <TableCell title={paginatedData[index].id}>
                  {paginatedData[index].title}
                </TableCell>
                <TableCell sx={{whiteSpace: 'pre-wrap'}}>
                  {getNominationCategoriesForMovie(
                    paginatedData[index].id,
                    nominations,
                    categories,
                  )
                    .map(nom => nom.shortName)
                    .join(', ')}
                </TableCell>
                {users.map(user => (
                  <TableCell
                    key={user.id}
                    sx={{display: 'fill'}}
                    align="center">
                    <WatchlistCell
                      userId={user.id}
                      movieId={paginatedData[index].id}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={movies.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}

// Wrap the export with Suspense, ErrorBoundary
export default function NomineeTableWrapper() {
  return (
    <QueryErrorResetBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <NomineeTable />
      </Suspense>
    </QueryErrorResetBoundary>
  );
}
//function nominationOptions(
//  year: number,
//): import('@tanstack/react-query').UseSuspenseQueryOptions<
//  unknown,
//  Error,
//  unknown,
//  import('@tanstack/react-query').QueryKey
//> {
//  throw new Error('Function not implemented.');
//}
