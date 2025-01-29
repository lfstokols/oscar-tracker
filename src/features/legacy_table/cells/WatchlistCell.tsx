import React, {Suspense} from 'react';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {LinearProgress, TableCell} from '@mui/material';
import {Error as ErrorIcon} from '@mui/icons-material';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {
  onMutateError,
  updateCacheOnSuccess,
  updateWatchlistMutationFn,
} from '../../../hooks/mutationOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useNotifications} from '../../../providers/NotificationContext';
import {WatchListSchema} from '../../../types/APIDataSchema';
import {Typography} from '@mui/material';
import {ClickableTooltip} from '../../../components/ClickableTooltip';
import {
  TODO_COLOR,
  SEEN_COLOR,
  NO_STATUS_COLOR,
} from '../../../config/StyleChoices';
import {WatchStatus} from '../../../types/Enums';

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
  // TODO - Consider upgrading to React v19 to get fancy use() hook
  const context = useOscarAppContext();

  const year = context.year;
  const notifications = useNotifications();
  const idList = movieId instanceof Array ? movieId : [movieId];
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateWatchlistMutationFn(idList, year),
    onSuccess: updateCacheOnSuccess(
      watchlistOptions(year).queryKey,
      WatchListSchema.parse,
      queryClient,
    ),
    onError: onMutateError('Failed to update watch status.', notifications),
  });

  const watchlistDataPromise = useSuspenseQuery(watchlistOptions(year));
  // if (watchlistDataPromise.isPending) return <LinearProgress />;
  if (watchlistDataPromise.isError) return <ErrorIcon />;
  const watchlist = watchlistDataPromise.data;

  const isEditingDisabled = context.activeUserId !== userId;
  const seenIsLocked = context.preferences.lockSeenToggle;
  const remoteWatchState =
    watchlist.find(
      item => idList.includes(item.movieId) && item.userId === userId,
    )?.status ?? WatchStatus.blank;
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
): (prevStatus: WatchStatus) => WatchStatus {
  return prevStatus => {
    if (seenIsLocked && prevStatus === WatchStatus.seen) {
      return WatchStatus.seen;
    }
    const statuses = [WatchStatus.todo, WatchStatus.blank, WatchStatus.seen];
    if (seenIsLocked) {
      statuses.splice(statuses.indexOf(WatchStatus.seen), 1);
    }
    const range = seenIsLocked ? 2 : 3;
    return statuses[(statuses.indexOf(prevStatus) + 1) % range];
  };
}

function display(watchstate: WatchStatus): string {
  return watchstate === WatchStatus.seen
    ? 'Seen'
    : watchstate === WatchStatus.todo
    ? 'To-Do'
    : ' ';
}

type FillProps = {
  watchstate: WatchStatus;
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
      variant="body2"
      onClick={handleInteract}
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor:
          watchstate === WatchStatus.blank
            ? NO_STATUS_COLOR
            : watchstate === WatchStatus.seen
            ? SEEN_COLOR
            : TODO_COLOR,
        opacity: disabled ? 0.7 : 1,
        minHeight: '32px',
        width: '60px',
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
  const {userId} = props;

  return (
    <Suspense fallback={<LinearProgress />}>
      <TableCell
        key={userId}
        sx={{display: 'fill', className: 'watchlist-column'}}
        align="center">
        <WatchlistCell {...props} />
      </TableCell>
    </Suspense>
  );
}
