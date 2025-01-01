import React, { Suspense, use, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { WatchFilter } from '../App';
import WatchlistCell from './WatchlistCell';

//const TEST_DATA = '{ "users": [{ "username": "Logan", "watchedMovies": ["Oppenheimer"] }], "movies": [ { "title": "Oppenheimer", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Poor Things", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Killers of the Flower Moon", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Barbie", "nominations": [ "Best Picture", "Actor", "Actress" ] } ] }';


const year = 2023;

function mapMovie(data: any[]): RawMovie[] {
	return data.map(item => ({
		movieId: item.id,
		title: item.title,
	}));
}
function mapNom(data: any[]): Nom[] {
	return data.map(item => ({
		movieId: item.movie,
		catId: item.category,
		note: item.note,
	}));
}
function mapUser(data: any[]): RawUser[] {
	return data.map(item => ({
		userId: item.id,
		username: item.username,
	}));
}
function mapCategory(data: any[]): Category[] {
	return data.map(item => ({
		catId: item.id,
		shortName: item.shortName,
		fullName: item.fullName,
		hasNote: item.hasNote,
		isShort: item.isShort,
		grouping: item.grouping,
		maxNoms: item.maxNoms,
	}));
}

export type Row = {
	title: string,
	categories: string,
} & Record<Exclude<string, 'title' | 'categories'>, watchStatus>

function NomineeTable(): React.ReactElement {
	const allStates = {
		movies: useState<RawMovie[]|null>(null),
		users: useState<RawUser[]|null>(null),
		nominations: useState<Nom[]|null>(null),
		categories: useState<Category[]|null>(null),
		watchlist: useState<WatchNotice[]|null>(null),
	};

	useEffect(() => {
		const fetchData = () => {
			fetch(`/api/${'movies'}?year=${year}`, {method: 'GET'})
				.then(response => response.json())
				.then(data => allStates['movies'][1](mapMovie(data)))
				.catch(error => {
					console.error(error);
					setTimeout(fetchData, 3000); // Retry after 3 seconds
				});
		};
		fetchData();
		}, [year]);
	useEffect(() => {
		const fetchData = () => {
			fetch(`/api/${'users'}?year=${year}`, {method: 'GET'})
				.then(response => response.json())
				.then(data => allStates['users'][1](mapUser(data)))
				.catch(error => {
					console.error(error);
					setTimeout(fetchData, 3000); // Retry after 3 seconds
				});
		};
		fetchData();
		}, [year]);
	useEffect(() => {
		const fetchData = () => {
			fetch(`/api/${'nominations'}?year=${year}`, {method: 'GET'})
				.then(response => response.json())
				.then(data => allStates['nominations'][1](mapNom(data)))
				.catch(error => {
					console.error(error);
					setTimeout(fetchData, 3000); // Retry after 3 seconds
				});
		};
		fetchData();
		}, [year]);
	useEffect(() => {
		const fetchData = () => {
			fetch(`/api/${'categories'}?year=${year}`, {method: 'GET'})
				.then(response => response.json())
				.then(data => allStates['categories'][1](mapCategory(data)))
				.catch(error => {
					console.error(error);
					setTimeout(fetchData, 3000); // Retry after 3 seconds
				});
		};
		fetchData();
		}, [year]);
	useEffect(() => {
		const fetchData = () => {
			fetch(`/api/${'watchlist'}?year=${year}`, {method: 'GET'})
				.then(response => response.json())
				.then(data => allStates['watchlist'][1]((data)))
				.catch(error => {
					console.error(error);
					setTimeout(fetchData, 3000); // Retry after 3 seconds
				});
		};
		fetchData();
		}, [year]);
		
	//const data = JSON.parse(TEST_DATA) as Data;

	//const users = data.users as User[];
	//const movies = data.movies as Movie[];

	//  const data = useLazyLoadQuery(NomineesQuery, {});
	//  const [commitMutation] = useMutation(ToggleWatchedMutation);

	//const data = { movies: [{ title: "", nominations: [{}] }], users: [] };
	
	const allData = {
		movies: allStates.movies[0],
		users: allStates.users[0],
		nominations: allStates.nominations[0],
		categories: allStates.categories[0],
		watchlist: allStates.watchlist[0],
	};

	if (!allData || !allData.movies || !allData.users || !allData.nominations || !allData.categories || !allData.watchlist)
		return <div>No data available</div>;

	const handleWatchToggle = (username: string, movieTitle: string, currentlyWatched: boolean) => {
		console.log("you did the thing!", {
			variables: {
				username,
				movieTitle,
				watched: !currentlyWatched,
			},
		});
		//commitMutation({
		//	variables: {
		//		username,
		//		movieTitle,
		//		watched: !currentlyWatched,
		//	},
		//});
	};

	// Logan! Insert this at the end...
	// tableData = allData.movies.forEach(movie => getRowInfo(movie, allData.nominations!, allData.users!, allData.watchlist!));
	// This is the code that was being used before:
	//
	// Transform data for the table
	//const tableData = allData.movies.map((movie: RawMovie) => {
	//	const row = {
	//		title: movie.title,
	//		categories: movie.nominations.join(', '),
	//	} as Row;
	function getRowInfo(movie: RawMovie, nominations: Nom[], users: RawUser[], 
														watchlist: WatchNotice[], categories: Category[]): Row {
		// Get nomination list for this movie
		//const nomList = nominations.filter(nom => nom.movieId === movie.movieId)
		//	.map(nom => categories
		//		.find(cat => cat.catId === nom.catId)!.shortName)// ?? 'Unknown')
		//	.join(', ');
		const myNomTable = nominations.filter(nom => nom.movieId === movie.movieId)
		//console.log(myNomTable.length)
		const nomList = myNomTable
			.map(nom => categories.find(cat => cat.catId === nom.catId)?.shortName ?? 'Unknown')
			.join(', ');
		// get watch status for each user
		let watchStatuses = users.reduce((acc, user) => {
			const watchStatus = watchlist.slice().reverse()
				.find(watchnotice => (watchnotice.movieId === movie.movieId) && (user.userId === watchnotice.userId))
				?.status || '' as watchStatus;
			acc[user.username] = watchStatus;
			return acc;
			}, {} as {[key: string]: watchStatus});
		const row = {
			title: movie.title,
			categories: nomList,
			...watchStatuses,
		} as Row;
		return row;
	};

	const tableData = allData.movies.map((movie: RawMovie) => {
		return getRowInfo(movie, allData.nominations!, allData.users!, allData.watchlist!, allData.categories!);
	});

	const columns = [
		{
			name: 'Film',
			selector: (row: Row) => row.title,
			sortable: true,
		},
		{
			name: 'Nominated For',
			selector: (row: Row) => row.categories,
			sortable: true,
			wrap: true,
		},
		// Generate user columns
		...allData.users.map(user => ({
			name: user.username,
			selector: (row: Row) => row[user.username],
			cell: (row: Row) => (
				<WatchlistCell initState={row[user.username]} />
				//<input
				//	type="checkbox"
				//	checked={row[user.username] as boolean}
				//	onChange={() => handleWatchToggle(user.username, row.title as string, row[user.username] as boolean)}
				///>
			),
			center: true,
		})),
	];

	return (
		<div>
			<DataTable
				columns={columns}
				data={tableData}
				pagination
				responsive
				highlightOnHover
				striped
			/>
		</div>
	);
}

type Props = {
	filterWatched: WatchFilter,
}

// Wrap the export with Suspense
export default function NomineeTableWrapper({filterWatched}: Props) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<NomineeTable />
		</Suspense>
	);
}