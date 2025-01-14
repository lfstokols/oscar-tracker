import React, {useState} from 'react';
import WatchlistCell from './WatchlistCell';
import {
  getNominationCategoriesForMovie,
  getMovieWatchStatusForUser,
} from '../../utils/dataSelectors';
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
import {DataFlavor, WatchStatus} from '../../types/Enums';
import DefaultCatcher from '../../components/LoadScreen';
import {
  QueryErrorResetBoundary,
  useSuspenseQueries,
} from '@tanstack/react-query';
import {useOscarAppContext} from '../../providers/AppContext';
import {
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
} from '../../hooks/dataOptions';

function LegacyTable(): React.ReactElement {
  const year = useOscarAppContext().year;

  const [usersQ, nominationsQ, categoriesQ, moviesQ] = useSuspenseQueries({
    queries: [
      userOptions(),
      nomOptions(year),
      categoryOptions(),
      movieOptions(year),
    ],
  });
  const users = usersQ.data;
  const nominations = nominationsQ.data;
  const categories = categoriesQ.data;
  const movies = moviesQ.data;

  const sortedData = movies.sort((a, b) => (a.numNoms > b.numNoms ? -1 : 1));
  const [runtimeFormatted, setRuntimeFormatted] = useState(true);

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
        display: flex;
        flex-direction: column;
      }
      .scrollable-table {
        flex-grow: 1;
        overflow: auto;
        height: 100%;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none;  /* Internet Explorer 10+ */
      }
      .scrollable-table::-webkit-scrollbar { /* WebKit */
        display: none;
      }
    `}</style>
      <Paper
        sx={{
          width: '100%',
          height: 'calc(100vh - var(--template-frame-height, 0))',
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
              {sortedData.map((row, index) => (
                <TableRow key={row.title} hover>
                  <TableCell title={row.id} sx={{className: 'title-column'}}>
                    {sortedData[index].title}
                  </TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: 'pre-wrap',
                      className: 'nominations-column',
                    }}>
                    {getNominationCategoriesForMovie(
                      sortedData[index].id,
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
                      ? sortedData[index]['runtime(hours)']
                      : sortedData[index]['runtime(minutes)']}
                  </TableCell>
                  {users.map(user => (
                    <TableCell
                      key={user.id}
                      sx={{display: 'fill', className: 'watchlist-column'}}
                      align="center">
                      <WatchlistCell
                        userId={user.id}
                        movieId={sortedData[index].id}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

// Wrap the export with Suspense, ErrorBoundary
export default function LegacyTableWrapper() {
  return (
    <DefaultCatcher>
      <LegacyTable />
    </DefaultCatcher>
  );
}
