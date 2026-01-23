import {Chip, Stack, Typography} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import {ClickableTooltip} from '../../../components/ClickableTooltip';
import {SEEN_ICON, TODO_ICON} from '../../../components/Icons';
import {userOptions, watchlistOptions} from '../../../hooks/dataOptions';
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

  const [watchlistQ, usersQ] = useSuspenseQueries({
    queries: [watchlistOptions(year), userOptions()],
  });

  // Get watch statuses for this movie
  const movieWatches = watchlistQ.data.filter(w => w.movieId === movieId);

  // Count other users' statuses
  const otherUsersWatches = movieWatches.filter(w => w.userId !== activeUserId);
  const seenList = otherUsersWatches.filter(w => w.status === WatchStatus.seen);
  const todoList = otherUsersWatches.filter(w => w.status === WatchStatus.todo);

  return (
    <>
      {activeUserId !== null ? (
        <WatchlistCell movieId={movieId} userId={activeUserId} />
      ) : (
        <Typography color="text.secondary" variant="body2">
          Log in to track
        </Typography>
      )}
      <OtherUsersWatchSummary
        seenList={seenList}
        todoList={todoList}
        users={usersQ.data}
      />
    </>
  );
}

function OtherUsersWatchSummaryItem({
  watches,
  users,
  icon,
  color,
  text,
}: {
  watches: WatchList;
  users: UserList;
  icon: React.ReactElement;
  color: 'seen' | 'todo';
  text: string;
}): React.ReactElement {
  // const numberText = <Typography color = {color} >{count}</Typography>;
  const chip = (
    <Chip
      color={color}
      icon={icon}
      label={watches.length}
      size="small"
      variant="outlined"
    />
  );

  const watchedUserIds = watches.map(watch => watch.userId);
  const userNames = users
    .filter(user => watchedUserIds.includes(user.id))
    .map(user => user.username);

  const usernamesString =
    userNames.length === 0
      ? '0 users'
      : userNames.length === 1
        ? userNames[0]
        : `${userNames.slice(0, -1).join(', ')}, and ${userNames.slice(-1)[0]}`;

  return (
    <ClickableTooltip popup={`${text} ${usernamesString}`}>
      {chip}
    </ClickableTooltip>
  );
}

function OtherUsersWatchSummary({
  seenList,
  todoList,
  users,
}: {
  seenList: WatchList;
  todoList: WatchList;
  users: UserList;
}): React.ReactElement {
  return (
    <Stack direction="row" gap={1}>
      <OtherUsersWatchSummaryItem
        color="seen"
        icon={SEEN_ICON}
        text="Seen by"
        users={users}
        watches={seenList}
      />
      <OtherUsersWatchSummaryItem
        color="todo"
        icon={TODO_ICON}
        text="Todo for"
        users={users}
        watches={todoList}
      />
    </Stack>
  );
}
