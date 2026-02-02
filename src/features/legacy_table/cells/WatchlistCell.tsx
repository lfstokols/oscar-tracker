import {Add as AddIcon, Error as ErrorIcon} from '@mui/icons-material';
import {LinearProgress, TableCell, Typography} from '@mui/material';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import * as React from 'react';
import {Suspense} from 'react';
import {ClickableTooltip} from '../../../components/ClickableTooltip';
import {
  NO_STATUS_COLOR,
  NO_STATUS_CONTRAST_COLOR,
  SEEN_COLOR,
  SEEN_CONTRAST_COLOR,
  TODO_COLOR,
  TODO_CONTRAST_COLOR,
} from '../../../config/StyleChoices';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {
  onMutateError,
  updateCacheOnSuccess,
  updateWatchlistMutationFn,
} from '../../../hooks/mutationOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useNotifications} from '../../../providers/NotificationContext';
import {WatchListSchema} from '../../../types/APIDataSchema';
import {WatchStatus} from '../../../types/Enums';

type Props = {
  movieId: MovieId | MovieId[];
  userId: UserId;
};

export function WatchlistCell({movieId, userId}: Props): React.ReactElement {
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
      arrow={true}
      popup={isEditingDisabled ? 'You can only edit your own watchlist' : ''}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <MyFill
          disabled={isEditingDisabled}
          handleInteract={() => {
            if (!isEditingDisabled) {
              mutation.mutate(nextStatus(localWatchState));
            }
          }}
          watchstate={localWatchState}
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
    const statuses = [WatchStatus.blank, WatchStatus.todo, WatchStatus.seen];
    if (seenIsLocked) {
      statuses.splice(statuses.indexOf(WatchStatus.seen), 1);
    }
    const range = seenIsLocked ? 2 : 3;
    return statuses[(statuses.indexOf(prevStatus) + 1) % range];
  };
}

function display(watchstate: WatchStatus): React.ReactNode {
  return watchstate === WatchStatus.seen ? (
    'Seen'
  ) : watchstate === WatchStatus.todo ? (
    'To-Do'
  ) : (
    <AddIcon />
  ); //'\u00A0';
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
  const backgroundColor =
    watchstate === WatchStatus.blank
      ? NO_STATUS_COLOR
      : watchstate === WatchStatus.seen
        ? SEEN_COLOR
        : TODO_COLOR;
  const textColor =
    watchstate === WatchStatus.blank
      ? NO_STATUS_CONTRAST_COLOR
      : watchstate === WatchStatus.seen
        ? SEEN_CONTRAST_COLOR
        : TODO_CONTRAST_COLOR;
  return (
    <Typography
      onClick={handleInteract}
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor,
        color: textColor,
        fontWeight: 600,
        opacity: disabled ? 0.7 : 1,
        minHeight: '32px',
        width: '60px',
        height: '100%',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        lineHeight: 1,
        borderTop: '2px solid rgba(255,255,255,0.4)',
        borderLeft: '2px solid rgba(255,255,255,0.4)',
        borderBottom: '2px solid rgba(0,0,0,0.2)',
        borderRight: '2px solid rgba(0,0,0,0.2)',
        '&:active': disabled
          ? {}
          : {
              borderTop: '2px solid rgba(0,0,0,0.2)',
              borderLeft: '2px solid rgba(0,0,0,0.2)',
              borderBottom: '2px solid rgba(255,255,255,0.4)',
              borderRight: '2px solid rgba(255,255,255,0.4)',
            },
      }}
      variant="body1">
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
        align="center"
        sx={{display: 'fill', className: 'watchlist-column'}}>
        <WatchlistCell {...props} />
      </TableCell>
    </Suspense>
  );
}
