import React, { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearProgress } from "@mui/material";
import { Error } from "@mui/icons-material";
import { WatchStatus } from "../types/Enums";
import useWatchlist from "../hooks/useWatchlist";
import { OscarAppContext } from "../contexts/AppContext";

type Props = {
	movieId: MovieId;
	userId: UserId;
};

export default function WatchlistCell({
	movieId,
	userId,
}: Props): React.ReactElement {
	const { isPending, isError, watchlist } = useWatchlist();
	const queryClient = useQueryClient();
	const { activeUserId } = useContext(OscarAppContext);
	const mutation = useMutation({
		mutationFn: async (newState: WatchStatus) => {
			const body = JSON.stringify({ movieId, status: newState, year: 2023 });
			return await fetch("api/watchlist", {
				method: "PUT",
				body,
				headers: { "Content-Type": "application/json" },
			});
		},
		onSuccess: async (response) => {
			return queryClient.setQueryData(["watchlistData"], await response.json());
			//return await queryClient.invalidateQueries({
			//	queryKey: ["watchlistData"],
			//});
		},
	});
	if (isPending) return <LinearProgress />;
	if (isError) return <Error />;

	const isEditingDisabled = activeUserId !== userId;
	const remoteWatchState: WatchStatus =
		watchlist!.find((item) => item.movieId === movieId)?.status ??
		WatchStatus.blank;
	const localWatchState = mutation.isPending
		? mutation.variables
		: remoteWatchState;

	//if (mutation.isPending)
	//	const handleInteract = () => {
	//		const newState = nextStatus(prevState);
	//	};
	return (
		<MyFill
			watchstate={localWatchState}
			handleInteract={() => {
				!isEditingDisabled && mutation.mutate(nextStatus(localWatchState));
			}}
		/>
	);
}

function nextStatus(prevStatus: WatchStatus): WatchStatus {
	const statuses: WatchStatus[] = [
		WatchStatus.blank,
		WatchStatus.seen,
		WatchStatus.todo,
	];
	return statuses[(statuses.indexOf(prevStatus) + 1) % 3];
}

function display(watchstate: WatchStatus): string {
	return watchstate === WatchStatus.seen
		? "Seen"
		: watchstate === WatchStatus.todo
		? "To-Do"
		: "";
}

type FillProps = {
	watchstate: WatchStatus;
	handleInteract: () => void;
};
function MyFill({ watchstate, handleInteract }: FillProps): React.ReactElement {
	return (
		<div
			onClick={handleInteract}
			style={{
				cursor: "pointer",
				backgroundColor:
					watchstate === WatchStatus.blank
						? "lightgrey"
						: watchstate === WatchStatus.seen
						? "lightgreen"
						: "lightgoldenrodyellow",
				minWidth: "50px",
				minHeight: "20px",
				width: "100%",
				height: "100%",
				borderRadius: "5px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				userSelect: "none",
			}}
		>
			{display(watchstate)}
		</div>
	);
}
