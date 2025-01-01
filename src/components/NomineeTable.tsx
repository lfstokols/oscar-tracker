import React, { Suspense, useState } from 'react';
import { WatchFilter } from '../App';
import WatchlistCell from './WatchlistCell';
import useData from '../hooks/useData';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel
} from '@mui/material';

//const TEST_DATA = '{ "users": [{ "username": "Logan", "watchedMovies": ["Oppenheimer"] }], "movies": [ { "title": "Oppenheimer", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Poor Things", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Killers of the Flower Moon", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Barbie", "nominations": [ "Best Picture", "Actor", "Actress" ] } ] }';


const year = 2023;

export type Row = {
	title: string,
	categories: string,
} & Record<Exclude<string, 'title' | 'categories'>, watchStatus>

function NomineeTable(): React.ReactElement {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [orderBy, setOrderBy] = useState<keyof Row>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const { isPending, isError, allData, isFetching } = useData(year);
	
	//const allStates = {
	//	movies: useState<RawMovie[] | null>(null),
	//	users: useState<RawUser[] | null>(null),
	//	nominations: useState<Nom[] | null>(null),
	//	categories: useState<Category[] | null>(null),
	//	watchlist: useState<WatchNotice[] | null>(null),
	//};
	//
	//useEffect(() => {
	//	const fetchData = () => {
	//		fetch(`/api/${'movies'}?year=${year}`, { method: 'GET' })
	//			.then(response => response.json())
	//			.then(data => allStates['movies'][1](mapMovie(data)))
	//			.catch(error => {
	//				console.error(error);
	//				setTimeout(fetchData, 3000); // Retry after 3 seconds
	//			});
	//	};
	//	fetchData();
	//}, [year]);
	//useEffect(() => {
	//	const fetchData = () => {
	//		fetch(`/api/${'users'}?year=${year}`, { method: 'GET' })
	//			.then(response => response.json())
	//			.then(data => allStates['users'][1](mapUser(data)))
	//			.catch(error => {
	//				console.error(error);
	//				setTimeout(fetchData, 3000); // Retry after 3 seconds
	//			});
	//	};
	//	fetchData();
	//}, [year]);
	//useEffect(() => {
	//	const fetchData = () => {
	//		fetch(`/api/${'nominations'}?year=${year}`, { method: 'GET' })
	//			.then(response => response.json())
	//			.then(data => allStates['nominations'][1](mapNom(data)))
	//			.catch(error => {
	//				console.error(error);
	//				setTimeout(fetchData, 3000); // Retry after 3 seconds
	//			});
	//	};
	//	fetchData();
	//}, [year]);
	//useEffect(() => {
	//	const fetchData = () => {
	//		fetch(`/api/${'categories'}?year=${year}`, { method: 'GET' })
	//			.then(response => response.json())
	//			.then(data => allStates['categories'][1](mapCategory(data)))
	//			.catch(error => {
	//				console.error(error);
	//				setTimeout(fetchData, 3000); // Retry after 3 seconds
	//			});
	//	};
	//	fetchData();
	//}, [year]);
	//useEffect(() => {
	//	const fetchData = () => {
	//		fetch(`/api/${'watchlist'}?year=${year}`, { method: 'GET' })
	//			.then(response => response.json())
	//			.then(data => allStates['watchlist'][1]((data)))
	//			.catch(error => {
	//				console.error(error);
	//				setTimeout(fetchData, 3000); // Retry after 3 seconds
	//			});
	//	};
	//	fetchData();
	//}, [year]);
	//
	//const allData = {
	//	movies: allStates.movies[0],
	//	users: allStates.users[0],
	//	nominations: allStates.nominations[0],
	//	categories: allStates.categories[0],
	//	watchlist: allStates.watchlist[0],
	//};
	

	function getRowInfo(movie: RawMovie, nominations: Nom[], users: RawUser[],
		watchlist: WatchNotice[], categories: Category[]): Row {
		// Get nomination list for this movie
		const nomList = nominations.filter(nom => nom.movieId === movie.movieId)
			.map(nom => categories.find(cat => cat.catId === nom.catId)?.shortName ?? 'Unknown')
			.join(', ');
		// get watch status for each user
		const watchStatuses = users.reduce((acc, user) => {
			const watchStatus = watchlist.slice().reverse()
				.find(watchnotice => (watchnotice.movieId === movie.movieId) && (user.userId === watchnotice.userId))
				?.status || '' as watchStatus;
			acc[user.username] = watchStatus;
			return acc;
		}, {} as { [key: string]: watchStatus });
		const row = {
			title: movie.title,
			categories: nomList,
			...watchStatuses,
		} as Row;
		return row;
	};

	const tableData = allData.movies?.map((movie: RawMovie) => {
		return getRowInfo(movie, allData.nominations!, allData.users!, allData.watchlist!, allData.categories!);
	});

	
	const sortedData = React.useMemo(() => {
		if (!tableData) return [];
		return [...tableData].sort((a, b) => {
		  if (order === 'asc') {
			return a[orderBy] < b[orderBy] ? -1 : 1;
		  } else {
			return b[orderBy] < a[orderBy] ? -1 : 1;
		  }
		});
	  }, [tableData, order, orderBy]);

	  if (isPending)	return <div>Waiting for data...</div>;
	  if (isError)	return <div>Error fetching data :(</div>;
	
	  if (!allData || !allData.movies || !allData.users || !allData.nominations || !allData.categories || !allData.watchlist || !tableData)
		  return <div>No data available</div>;

  const handleChangePage = (event: unknown, newPage: number) => {
	setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
	setRowsPerPage(parseInt(event.target.value, 10));
	setPage(0);
  };

  const handleSort = (property: keyof Row) => {
	const isAsc = orderBy === property && order === 'asc';
	setOrder(isAsc ? 'desc' : 'asc');
	setOrderBy(property);
  };

  const paginatedData = sortedData.slice(
	page * rowsPerPage,
	page * rowsPerPage + rowsPerPage
  );

  return (
	<Paper sx={{ width: '100%', overflow: 'hidden' }}>
	  <TableContainer>
		<Table stickyHeader>
		  <TableHead>
			<TableRow>
			  <TableCell>
				<TableSortLabel
				  active={orderBy === 'title'}
				  direction={orderBy === 'title' ? order : 'asc'}
				  onClick={() => handleSort('title')}
				>
				  Film
				</TableSortLabel>
			  </TableCell>
			  <TableCell>
				<TableSortLabel
				  active={orderBy === 'categories'}
				  direction={orderBy === 'categories' ? order : 'asc'}
				  onClick={() => handleSort('categories')}
				>
				  Nominated For
				</TableSortLabel>
			  </TableCell>
			  {allData.users.map(user => (
				<TableCell key={user.userId} align="center">
				  {user.username}
				</TableCell>
			  ))}
			</TableRow>
		  </TableHead>
		  <TableBody>
			{paginatedData.map((row, index) => (
			  <TableRow key={index} hover>
				<TableCell>{row.title}</TableCell>
				<TableCell sx={{ whiteSpace: 'pre-wrap' }}>{row.categories}</TableCell>
				{allData.users!.map(user => (
				  <TableCell key={user.userId} align="center">
					<WatchlistCell initState={row[user.username]} />
				  </TableCell>
				))}
			  </TableRow>
			))}
		  </TableBody>
		</Table>
	  </TableContainer>
	  <TablePagination
		rowsPerPageOptions={[5, 10, 25]}
		component="div"
		count={tableData.length}
		rowsPerPage={rowsPerPage}
		page={page}
		onPageChange={handleChangePage}
		onRowsPerPageChange={handleChangeRowsPerPage}
	  />
	</Paper>
  );
}

type Props = {
	filterWatched: WatchFilter,
}

// Wrap the export with Suspense
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function NomineeTableWrapper({ filterWatched }: Props) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<NomineeTable />
		</Suspense>
	);
}