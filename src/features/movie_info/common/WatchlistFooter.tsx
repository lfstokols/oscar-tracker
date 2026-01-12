import {Stack, Typography} from '@mui/material';
import {useSuspenseQuery} from '@tanstack/react-query';
import {SEEN_COLOR, TODO_COLOR} from '../../../config/StyleChoices';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import {WatchStatus} from '../../../types/Enums';
import {WatchlistCell} from '../../legacy_table/cells/WatchlistCell';

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

function OtherUsersWatchSummary({
  seenCount,
  todoCount,
}: {
  seenCount: number;
  todoCount: number;
}): React.ReactElement {
  function seenText(count: number): string {
    return `${count} others have seen this movie`;
  }
  function todoText(count: number): string {
    return `${count} others want to watch this movie`;
  }
  return (
    <Stack direction="column" gap={1}>
      <Typography
        sx={{
          color: SEEN_COLOR,
        }}
        variant="caption">
        {seenText(seenCount)}
      </Typography>
      <Typography
        sx={{
          color: TODO_COLOR,
        }}
        variant="caption">
        {todoText(todoCount)}
      </Typography>
    </Stack>
  );
}
