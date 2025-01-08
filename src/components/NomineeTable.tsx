import React, {Suspense, useState} from 'react';
import WatchlistCell from './WatchlistCell';
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
} from '@mui/material';
import {DataFlavor, WatchStatus} from '../types/Enums';
import {LoadScreen} from '../App';
import {
  QueryErrorResetBoundary,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {useOscarAppContext} from '../contexts/AppContext';
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

  const [runtimeFormatted, setRuntimeFormatted] = useState(true);
  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <style>{`
      .title-column {
        border: 5px solid #ccc;
      }
      .nominations-column {
        max-width: 300px;
      }
      .table-container {
        /* Calculate height by subtracting header + countdown + padding */
        height: calc(100vh - 310px);
        display: flex;
        flex-direction: column;
      }
      .scrollable-table {
        flex-grow: 1;
        overflow: auto;
      }
    `}</style>
      <Paper
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="table-container">
        <TableContainer className="scrollable-table">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{minWidth: 200, className: 'title-column'}}>
                  Film
                </TableCell>
                <TableCell
                  sx={{minWidth: 200, className: 'nominations-column'}}>
                  Nominated For
                </TableCell>
                <TableCell
                  sx={{minWidth: 200, className: 'runtime-column'}}
                  onClick={() => setRuntimeFormatted(!runtimeFormatted)}
                  style={{cursor: 'pointer'}}
                  align="center"
                  title="Click to toggle runtime format">
                  Runtime
                </TableCell>
                {users.map(user => (
                  <TableCell
                    key={user.id}
                    align="center"
                    sx={{className: 'watchlist-column'}}>
                    {user.username}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={paginatedData[index].title} hover>
                  <TableCell
                    title={paginatedData[index].id}
                    sx={{className: 'title-column'}}>
                    {paginatedData[index].title}
                  </TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: 'pre-wrap',
                      className: 'nominations-column',
                    }}>
                    {getNominationCategoriesForMovie(
                      paginatedData[index].id,
                      nominations,
                      categories,
                    )
                      .map(nom => nom.shortName)
                      .join(', ')}
                  </TableCell>
                  <TableCell
                    sx={{minWidth: 200, className: 'runtime-column'}}
                    align="center">
                    {runtimeFormatted
                      ? paginatedData[index]['runtime(hours)']
                      : paginatedData[index]['runtime(minutes)']}
                  </TableCell>
                  {users.map(user => (
                    <TableCell
                      key={user.id}
                      sx={{display: 'fill', className: 'watchlist-column'}}
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
          component="div"
          rowsPerPageOptions={[10, 25, 50]}
          count={-1}
          rowsPerPage={-1}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </>
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
