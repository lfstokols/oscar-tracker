import {Chip, Stack, Typography} from '@mui/material';
import {useSuspenseQuery} from '@tanstack/react-query';
import { ClickableTooltip } from '../../../components/ClickableTooltip';
import { SEEN_ICON, TODO_ICON } from '../../../components/Icons';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import {WatchStatus} from '../../../types/Enums';
import {WatchlistCell} from '../../legacy_table/cells/WatchlistCell';

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    seen: true;
    todo: true;
  }
}


export default function WatchlistFooter({
  movieId,
}: {
  movieId: MovieId | MovieId[];
}): React.ReactElement {
  const context = useOscarAppContext();
  const year = context.year;
  const activeUserId = context.activeUserId;

  const {data: watchlist} = useSuspenseQuery(watchlistOptions(year));

  // Get watch statuses for this movie
  const movieWatches = watchlist.filter(w => w.movieId === movieId);

  // Count other users' statuses
  const otherUsersWatches = movieWatches.filter(w => w.userId !== activeUserId);
  const seenCount = otherUsersWatches.filter(
    w => w.status === WatchStatus.seen,
  ).length;
  const todoCount = otherUsersWatches.filter(
    w => w.status === WatchStatus.todo,
  ).length;

  return (
    <>
      {activeUserId !== null ? (
        <WatchlistCell movieId={movieId} userId={activeUserId} />
      ) : (
        <Typography color="text.secondary" variant="body2">
          Log in to track
        </Typography>
      )}
      <OtherUsersWatchSummary seenCount={seenCount} todoCount={todoCount} />
    </>
  );
}

function OtherUsersWatchSummaryItem({
  count,
  icon,
  color,
  text,
}: {
  count: number;
  icon: React.ReactElement;
  color: 'seen' | 'todo';
  text: string;
}): React.ReactElement {
  // const numberText = <Typography color = {color} >{count}</Typography>;
  const chip = <Chip color = {color} icon={icon} label={count}  size="small" variant="outlined"/>;

  return (
    <ClickableTooltip popup={`${count} other users ${text} this movie`}>
      {chip}
    </ClickableTooltip>
  );
}

function OtherUsersWatchSummary({
  seenCount,
  todoCount,
}: {
  seenCount: number;
  todoCount: number;
}): React.ReactElement {
  return (
    <Stack direction="row" gap={1}>
        <OtherUsersWatchSummaryItem color="seen" count={seenCount} icon={SEEN_ICON} text="have seen" />
        <OtherUsersWatchSummaryItem color="todo" count={todoCount} icon={TODO_ICON} text="plan to watch" />
    </Stack>
  );
}
