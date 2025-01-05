import { useQuery } from "@tanstack/react-query";

export default function useData(year: number): {
	isPending: boolean;
	isError: boolean;
	allData: {
		movies: RawMovie[] | undefined;
		users: RawUser[] | undefined;
		nominations: Nom[] | undefined;
		categories: Category[] | undefined;
		watchlist: WatchNotice[] | undefined;
	};
	isFetching: boolean;
} {
	const movieResults = useQuery({
		queryKey: ["movieData"],
		queryFn: async (): Promise<unknown> => {
			const response = await fetch(`api/${"movies"}?year=${year}`, {
				method: "GET",
			});
			return await response.json();
		},
	});
	const userResults = useQuery({
		queryKey: ["userData"],
		queryFn: async (): Promise<unknown> => {
			const response = await fetch(`api/${"users"}?year=${year}`, {
				method: "GET",
			});
			return (await response.json()) as RawUser[];
		},
	});
	const nomResults = useQuery({
		queryKey: ["nominationData"],
		queryFn: async (): Promise<unknown> => {
			const response = await fetch(`api/${"nominations"}?year=${year}`, {
				method: "GET",
			});
			return (await response.json()) as Nom[];
		},
	});
	const catResults = useQuery({
		queryKey: ["categoryData"],
		queryFn: async (): Promise<unknown> => {
			const response = await fetch(`api/${"categories"}?year=${year}`, {
				method: "GET",
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return (await response.json()) as Category[];
		},
	});
	const watchResults = useQuery({
		queryKey: ["watchlistData"],
		queryFn: async (): Promise<unknown> => {
			const params = new URLSearchParams({
				year: year.toString(),
				userId: "all",
			});
			const response = await fetch(`api/${"watchlist"}?${params.toString()}`, {
				method: "GET",
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return (await response.json()) as WatchNotice[];
		},
	});
	const isPending =
		movieResults.isPending ||
		userResults.isPending ||
		nomResults.isPending ||
		catResults.isPending ||
		watchResults.isPending;
	const isFetching =
		movieResults.isFetching ||
		userResults.isFetching ||
		nomResults.isFetching ||
		catResults.isFetching ||
		watchResults.isFetching;
	const isError =
		movieResults.error !== null ||
		userResults.error !== null ||
		nomResults.error !== null ||
		catResults.error !== null ||
		watchResults.error !== null;
	const allData = {
		movies: mapMovie(movieResults.data),
		users: mapUser(userResults.data),
		nominations: mapNom(nomResults.data),
		categories: mapCategory(catResults.data),
		watchlist: mapWatchlist(watchResults.data),
	};
	return { isPending, isError, allData, isFetching };
}

function mapMovie(data: unknown | undefined): RawMovie[] | undefined {
	if (data === undefined) return undefined;
	if (!Array.isArray(data)) throw new Error("Movie Data is not an array");
	if (!data.every((item) => item.hasOwnProperty("id")))
		throw new Error("Movie Data does not have an id property");
	if (!data.every((item) => item.hasOwnProperty("title")))
		throw new Error("Movie Data does not have a title property");
	return data.map(
		(item): RawMovie => ({
			movieId: item.id,
			title: item.title,
		})
	);
}
function mapNom(data: unknown | undefined): Nom[] | undefined {
	if (data === undefined) return undefined;
	if (!Array.isArray(data)) throw new Error("Nomination Data is not an array");
	if (!data.every((item) => item.hasOwnProperty("movie")))
		throw new Error("Nomination Data does not have a movie property");
	if (!data.every((item) => item.hasOwnProperty("category")))
		throw new Error("Nomination Data does not have a category property");
	if (!data.every((item) => item.hasOwnProperty("note")))
		throw new Error("Nomination Data does not have a note property");
	return data.map(
		(item): Nom => ({
			movieId: item.movie,
			catId: item.category,
			note: item.note,
		})
	);
}
function mapUser(data: unknown | undefined): RawUser[] | undefined {
	if (data === undefined) return undefined;
	if (!Array.isArray(data)) throw new Error("User Data is not an array");
	if (!data.every((item) => item.hasOwnProperty("id")))
		throw new Error("User Data does not have an id property");
	if (!data.every((item) => item.hasOwnProperty("username")))
		throw new Error("User Data does not have a username property");
	return data.map(
		(item): RawUser => ({
			userId: item.id,
			username: item.username,
		})
	);
}
function mapCategory(data: unknown | undefined): Category[] | undefined {
	if (data === undefined) return undefined;
	if (!Array.isArray(data)) throw new Error("Category Data is not an array");
	if (!data.every((item) => item.hasOwnProperty("id")))
		throw new Error("Category Data does not have an id property");
	if (!data.every((item) => item.hasOwnProperty("shortName")))
		throw new Error("Category Data does not have a shortName property");
	if (!data.every((item) => item.hasOwnProperty("fullName")))
		throw new Error("Category Data does not have a fullName property");
	if (!data.every((item) => item.hasOwnProperty("hasNote")))
		throw new Error("Category Data does not have a hasNote property");
	if (!data.every((item) => item.hasOwnProperty("isShort")))
		throw new Error("Category Data does not have an isShort property");
	if (!data.every((item) => item.hasOwnProperty("grouping")))
		throw new Error("Category Data does not have a grouping property");
	if (!data.every((item) => item.hasOwnProperty("maxNoms")))
		throw new Error("Category Data does not have a maxNoms property");
	return data.map(
		(item): Category => ({
			catId: item.id,
			shortName: item.shortName,
			fullName: item.fullName,
			hasNote: item.hasNote,
			isShort: item.isShort,
			grouping: item.grouping,
			maxNoms: item.maxNoms,
		})
	);
}
function mapWatchlist(data: unknown | undefined): WatchNotice[] | undefined {
	if (data === undefined) return undefined;
	if (!Array.isArray(data))
		throw new Error(
			`Watchlist Data is not an array, nor a Banana. But it is a ${data}`
		);
	if (!data.every((item) => item.hasOwnProperty("userId")))
		throw new Error("Watchlist Data does not have a userId property");
	if (!data.every((item) => item.hasOwnProperty("movieId")))
		throw new Error("Watchlist Data does not have a movieId property");
	if (!data.every((item) => item.hasOwnProperty("status")))
		throw new Error("Watchlist Data does not have a status property");
	return data.map(
		(item): WatchNotice => ({
			userId: item.userId,
			movieId: item.movieId,
			status: item.status,
		})
	);
}
