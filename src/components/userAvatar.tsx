import Avatar from '@mui/material/Avatar';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Suspense} from 'react';

import {ErrorBoundary} from 'react-error-boundary';
import {userProfileOptions} from '../hooks/dataOptions';

export default function UserAvatarWrapper({
  userId,
  username,
}: {
  userId: UserId;
  username: string;
}) {
  const fallback = <FallbackAvatar username={username} />;

  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <UserAvatar userId={userId} username={username} />
      </Suspense>
    </ErrorBoundary>
  );
}

function FallbackAvatar({username}: {username: string}) {
  return <Avatar>{username.charAt(0).toUpperCase()}</Avatar>;
}

export function UserAvatar({
  userId,
  username,
}: {
  userId: UserId;
  username: string;
}) {
  const response = useSuspenseQuery(userProfileOptions(userId));
  const propic = response.data.propic;
  if (!propic) {
    return <Avatar>{username.charAt(0).toUpperCase()}</Avatar>;
  }
  return <Avatar src={propic} />;
}
