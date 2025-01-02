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
	title_tooltip: string,
	categories: string,
	category_tooltip: string|null,
} & Record<Exclude<string, 'title' | 'categories'>, WatchStatus>

export enum WatchStatus {
	seen = 'seen',
	todo = 'todo',
	blank = '',
}

function NomineeTable(): React.ReactElement {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [orderBy, setOrderBy] = useState<keyof Row>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const { isPending, isError, allData, isFetching } = useData(year);

	function getRowInfo(movie: RawMovie, nominations: Nom[], users: RawUser[],
								watchlist: WatchNotice[], categories: Category[]): Row {
		// Get nomination list for this movie
		const nomList = nominations.filter(nom => nom.movieId === movie.movieId)
			.map(nom => categories.find(cat => cat.catId === nom.catId)?.shortName ?? 'Unknown')
			.join(', ');
		// get watch status for each user
		const watchStatuses = users.reduce((acc:Record<string,WatchStatus>, user:RawUser) => {
			const watchStatus = watchlist.slice().reverse()
				.find(watchnotice => ((watchnotice.movieId === movie.movieId) && (watchnotice.userId === user.userId)))
				?.status || WatchStatus.blank;
			acc[user.username] = watchStatus;
			return acc;
		}, {});
		const row = {
			title: movie.title,
			title_tooltip: movie.movieId,
			categories: nomList,
			...watchStatuses,
		} as Row;
		return row;
	};

	const tableData = allData.movies?.map((movie: RawMovie) => {
		if (!allData.nominations || !allData.users || !allData.watchlist || !allData.categories) return undefined;
		return getRowInfo(movie, allData.nominations!, allData.users!, allData.watchlist!, allData.categories!);
	});

	
	const sortedData = React.useMemo(() => {
		if (!tableData || tableData.some((item)=>item===undefined)) return undefined;
		return [...tableData as Row[]].sort((a, b) => {
			let orderingAttr = ((str:string):string|number => str);
			if (orderBy === 'categories') orderingAttr = (str:string) => str.length;
		  if (order === 'asc') {
			return orderingAttr(a![orderBy]) < orderingAttr(b![orderBy]) ? -1 : 1;
		  } else {
			return orderingAttr(b![orderBy]) < orderingAttr(a![orderBy]) ? -1 : 1;
		  }
		});
	  }, [tableData, order, orderBy]);

	if (isPending)	return <div>Waiting for data...</div>;
	if (isError)	return <div>Error fetching data :</div>;

	if (!allData || !allData.movies || !allData.users || !allData.nominations || !allData.categories || !allData.watchlist || !tableData || !sortedData)
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
					<TableCell title={row.title_tooltip}>{row.title}</TableCell>
					<TableCell sx={{ whiteSpace: 'pre-wrap' }}>{row.categories}</TableCell>
					{allData.users!.map(user => (
					<TableCell key={user.userId} sx={{ display:"flex" }} align="center">
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
} // <-- Add this closing bracket

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