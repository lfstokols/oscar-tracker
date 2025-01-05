import { useQuery } from "@tanstack/react-query";

export default function useUsers(): {
	isPending: boolean;
	isError: boolean;
	users: RawUser[] | undefined;
	isFetching: boolean;
} {
	const results = useQuery({
		queryKey: ["userData"],
		queryFn: async (): Promise<RawUser[]> => {
			const response = await fetch("api/users", { method: "GET" });
			return (await response.json()) as RawUser[];
		},
	});
	const isError = results.error !== null;
	const users = mapUser(results.data);
	const isFetching = results.isFetching;
	const isPending = results.isPending;
	return { isPending, isError, users, isFetching };
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
