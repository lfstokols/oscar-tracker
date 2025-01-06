import React from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {LinearProgress} from '@mui/material';
import {Error as ErrorIcon} from '@mui/icons-material';
import {WatchStatus} from '../types/Enums';
import useWatchlist from '../hooks/useWatchlist';
import {useOscarAppContext} from '../contexts/AppContext';
import {useNotifications} from '../modules/notifications/NotificationContext';

type Props = {
  movieId: MovieId;
  userId: UserId;
};

export default function WatchlistCell({
  movieId,
  userId,
}: Props): React.ReactElement {
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const watchlistData = useWatchlist();

  const mutation = useMutation({
    mutationFn: async (newState: WatchStatus) => {
      const body = JSON.stringify({movieId, status: newState, year: 2023});
      return await fetch('api/watchlist', {
        method: 'PUT',
        body,
        headers: {'Content-Type': 'application/json'},
      });
    },
    onSuccess: async response => {
      return queryClient.setQueryData(['watchlistData'], await response.json());
      //return await queryClient.invalidateQueries({
      //	queryKey: ["watchlistData"],
      //});
    },
    onError: async response => {
      notifications.show({
        type: 'error',
        message: 'Failed to update watch status.',
      });
    },
  });
  if (watchlistData.isPending) return <LinearProgress />;
  if (watchlistData.isError) return <ErrorIcon />;
  if (watchlistData.isPending || watchlistData.isError)
    throw new Error('This should never happen kljsf');
  const watchlist = watchlistData.data; //as WatchNotice[]; // TODO - why is this not typed?

  // TODO - Consider upgrading to React v19 to get fancy use() hook
  //const isEditingDisabled = use(OscarAppContext).activeUserId !== userId;
  const isEditingDisabled = useOscarAppContext().activeUserId !== userId;
  const remoteWatchState: WatchStatus =
    watchlist.find(item => item.movieId === movieId)?.status ??
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
    ? 'Seen'
    : watchstate === WatchStatus.todo
    ? 'To-Do'
    : '';
}

type FillProps = {
  watchstate: WatchStatus;
  handleInteract: () => void;
};
function MyFill({watchstate, handleInteract}: FillProps): React.ReactElement {
  return (
    <div
      onClick={handleInteract}
      style={{
        cursor: 'pointer',
        backgroundColor:
          watchstate === WatchStatus.blank
            ? 'lightgrey'
            : watchstate === WatchStatus.seen
            ? 'lightgreen'
            : 'lightgoldenrodyellow',
        minWidth: '50px',
        minHeight: '20px',
        width: '100%',
        height: '100%',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}>
      {display(watchstate)}
    </div>
  );
}
