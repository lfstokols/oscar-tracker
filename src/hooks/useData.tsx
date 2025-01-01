import { useQuery } from '@tanstack/react-query';

export default function useData(year: number): 
									{ isPending: boolean, isError: boolean, 
										allData: { movies: RawMovie[] | undefined, 
												users: RawUser[] | undefined, 
												nominations: Nom[] | undefined, 
												categories: Category[] | undefined, 
												watchlist: WatchNotice[] | undefined 
											}, 
		isFetching: boolean } {
	const movieResults = useQuery({
		queryKey: ['movieData'],
		queryFn: async () => {
			const response = await fetch(
				`/api/${'movies'}?year=${year}`, { method: 'GET' }
			);
			return await response.json() as RawMovie[];
		},
	});
	const userResults = useQuery({
		queryKey: ['userData'],
		queryFn: async () => {
			const response = await fetch(
				`/api/${'users'}?year=${year}`, { method: 'GET' }
			);
			return await response.json() as RawUser[];
		},
	});
	const nomResults = useQuery({
		queryKey: ['nominationData'],
		queryFn: async () => {
			const response = await fetch(
				`/api/${'nominations'}?year=${year}`, { method: 'GET' }
			);
			return await response.json() as Nom[];
		},
	});
	const catResults = useQuery({
		queryKey: ['categoryData'],
		queryFn: async () => {
			const response = await fetch(
				`/api/${'categories'}?year=${year}`, { method: 'GET' }
			);
			return await response.json() as Category[];
		},
	});
	const watchResults = useQuery({
		queryKey: ['watchlistData'],
		queryFn: async () => {
			const response = await fetch(
				`/api/${'watchlist'}?year=${year}`, { method: 'GET' }
			);
			return await response.json() as WatchNotice[];
		},
	});
	const isPending = movieResults.isPending || userResults.isPending || nomResults.isPending || catResults.isPending || watchResults.isPending;
	const isFetching = movieResults.isFetching || userResults.isFetching || nomResults.isFetching || catResults.isFetching || watchResults.isFetching;
	const isError = movieResults.error !== null || userResults.error !== null || nomResults.error !== null || catResults.error !== null || watchResults.error !== null;
	const allData = {
		movies: mapMovie(movieResults.data),
		users: mapUser(movieResults.data),
		nominations: mapNom(nomResults.data),
		categories: mapCategory(catResults.data),
		watchlist: (watchResults.data),
	};
	return { isPending, isError, allData, isFetching };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMovie(data: any[] | undefined): RawMovie[] | undefined{
	if (data === undefined) return undefined;
	return data.map(item => ({
		movieId: item.id,
		title: item.title,
	}));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNom(data: any[] | undefined): Nom[] | undefined {
	if (data === undefined) return undefined;
	return data.map(item => ({
		movieId: item.movie,
		catId: item.category,
		note: item.note,
	}));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(data: any[] | undefined): RawUser[] | undefined {
	if (data === undefined) return undefined;
	return data.map(item => ({
		userId: item.id,
		username: item.username,
	}));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(data: any[] | undefined): Category[] | undefined {
	if (data === undefined) return undefined;
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