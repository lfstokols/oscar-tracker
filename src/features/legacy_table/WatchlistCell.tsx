import React from 'react';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {LinearProgress, Tooltip, TableCell} from '@mui/material';
import {Error as ErrorIcon} from '@mui/icons-material';
import {WatchStatuses} from '../../types/Enums';
import {watchlistOptions} from '../../hooks/dataOptions';
import {
  onMutateError,
  updateCacheOnSuccess,
  updateWatchlistMutationFn,
} from '../../hooks/mutationOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {useNotifications} from '../../providers/NotificationContext';
import {WatchListSchema} from '../../types/APIDataSchema';
import {Typography} from '@mui/material';
import {ClickableTooltip} from '../../components/ClickableTooltip';
import {
  TODO_COLOR,
  SEEN_COLOR,
  NO_STATUS_COLOR,
} from '../../config/StyleChoices';
type Props =
  | {
      movieId: MovieId;
      userId: UserId;
    }
  | {
      movieId: MovieId[];
      userId: UserId;
    };

function WatchlistCell({movieId, userId}: Props): React.ReactElement {
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const watchlistDataPromise = useSuspenseQuery(
    watchlistOptions(useOscarAppContext().year),
  );
  const idList = movieId instanceof Array ? movieId : [movieId];
  const year = useOscarAppContext().year;
  const mutation = useMutation({
    mutationFn: updateWatchlistMutationFn(idList, year),
    onSuccess: updateCacheOnSuccess(
      watchlistOptions(year).queryKey,
      WatchListSchema.parse,
      queryClient,
    ),
    onError: onMutateError('Failed to update watch status.', notifications),
  });

  if (watchlistDataPromise.isPending) return <LinearProgress />;
  if (watchlistDataPromise.isError) return <ErrorIcon />;
  const watchlist = watchlistDataPromise.data; //as WatchNotice[];

  // TODO - Consider upgrading to React v19 to get fancy use() hook
  //const isEditingDisabled = use(OscarAppContext).activeUserId !== userId;
  const context = useOscarAppContext();
  const isEditingDisabled = context.activeUserId !== userId;
  const seenIsLocked = context.preferences.lockSeenToggle;
  const remoteWatchState: WatchStatuses =
    watchlist.find(item => item.movieId === movieId && item.userId === userId)
      ?.status ?? WatchStatuses.blank;
  const localWatchState = mutation.isPending
    ? mutation.variables
    : remoteWatchState;
  const nextStatus = createStatusSwitcher(seenIsLocked);

  return (
    <ClickableTooltip
      popup={isEditingDisabled ? 'You can only edit your own watchlist' : ''}
      arrow={true}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <MyFill
          watchstate={localWatchState}
          handleInteract={() => {
            if (!isEditingDisabled) {
              mutation.mutate(nextStatus(localWatchState));
            }
          }}
          disabled={isEditingDisabled}
        />
      </div>
    </ClickableTooltip>
  );
}

function createStatusSwitcher(
  seenIsLocked: boolean,
): (prevStatus: WatchStatuses) => WatchStatuses {
  const nextStatus = (prevStatus: WatchStatuses): WatchStatuses => {
    if (seenIsLocked && prevStatus === WatchStatuses.seen) {
      return WatchStatuses.seen;
    }
    const statuses: WatchStatuses[] = [
      WatchStatuses.todo,
      WatchStatuses.blank,
      WatchStatuses.seen,
    ];
    if (seenIsLocked) {
      statuses.splice(statuses.indexOf(WatchStatuses.seen), 1);
    }
    const range = seenIsLocked ? 2 : 3;
    return statuses[(statuses.indexOf(prevStatus) + 1) % range];
  };
  return nextStatus;
}

function display(watchstate: WatchStatuses): string {
  return watchstate === WatchStatuses.seen
    ? 'Seen'
    : watchstate === WatchStatuses.todo
    ? 'To-Do'
    : ' ';
}

type FillProps = {
  watchstate: WatchStatuses;
  handleInteract: () => void;
  disabled?: boolean;
};
export function MyFill({
  watchstate,
  handleInteract,
  disabled,
}: FillProps): React.ReactElement {
  return (
    <Typography
      variant="h6"
      onClick={handleInteract}
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor:
          watchstate === WatchStatuses.blank
            ? NO_STATUS_COLOR
            : watchstate === WatchStatuses.seen
            ? SEEN_COLOR
            : TODO_COLOR,
        opacity: disabled ? 0.7 : 1,
        minHeight: '32px',
        width: '80px',
        height: '100%',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}>
      {display(watchstate)}
    </Typography>
  );
}

export default function WatchlistCellWrapper(props: Props): React.ReactElement {
  return (
    <TableCell
      key={props.userId}
      sx={{display: 'fill', className: 'watchlist-column'}}
      align="center">
      <WatchlistCell {...props} />
    </TableCell>
  );
}
