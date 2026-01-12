import {Avatar, Box, Chip, Typography} from '@mui/material';
import {Suspense} from 'react';
import UserAvatarWrapper from '../../../components/userAvatar';
import {UserId, UserList} from '../../../types/APIDataSchema';
import {WatchStatus} from '../../../types/Enums';

export default function UserStatusGroup({
  color,
  status,
  users,
  watches,
}: {
  color: string;
  status: WatchStatus;
  users: UserList;
  watches: Array<{status: WatchStatus; userId: UserId}>;
}): React.ReactElement {
  const statusLabel = status === WatchStatus.seen ? 'Seen' : 'Want to Watch';
  const userInfos = watches
    .map(w => users.find(u => u.id === w.userId))
    .filter((u): u is UserList[0] => u !== undefined);

  return (
    <Box>
      <Typography
        sx={{
          color: color,
          fontWeight: 'medium',
          mb: 1,
        }}
        variant="subtitle2">
        {statusLabel}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
          },
        }}>
        {userInfos.map(user => (
          <UserChip key={user.id} user={user} />
        ))}
      </Box>
    </Box>
  );
}

function UserChip({user}: {user: UserList[0]}): React.ReactElement {
  return (
    <Chip
      avatar={
        <Suspense
          fallback={<Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>}>
          <UserAvatarWrapper userId={user.id} username={user.username} />
        </Suspense>
      }
      label={user.username}
      size="small"
      sx={{flexShrink: 0}}
      variant="outlined"
    />
  );
}
