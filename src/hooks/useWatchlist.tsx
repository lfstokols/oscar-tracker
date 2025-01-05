import { useQuery } from "@tanstack/react-query";

// TODO - If you check isError and isPending, it will realize that data != undefined
export default function useWatchlist(): {
	isPending: boolean;
	isError: boolean;
	watchlist: WatchNotice[] | undefined;
	isFetching: boolean;
} {
	const results = useQuery({
		queryKey: ["watchlistData"],
		queryFn: async (): Promise<WatchNotice[]> => {
			const params = new URLSearchParams({ justMe: "false", year: "2023" });
			const response = await fetch(`api/watchlist?${params}`, {
				method: "GET",
			});
			return await response.json();
		},
	});
	const isError = results.isError;
	const watchlist = results.data;
	const isFetching = results.isFetching;
	const isPending = results.isPending;
	//checkData(results.data);
	return { isPending, isError, watchlist, isFetching };
}

function checkData(data: unknown | undefined): boolean {
	if (data === undefined) return false;
	data as WatchNotice[];
	if (!Array.isArray(data)) throw new Error("Watchlist Data is not an array");
	if (!data.every((item) => item.hasOwnProperty("id")))
		throw new Error("User Data does not have an id property");
	if (!data.every((item) => item.hasOwnProperty("username")))
		throw new Error("User Data does not have a username property");
	return true;
}
