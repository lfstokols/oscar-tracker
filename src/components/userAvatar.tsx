import Avatar from '@mui/material/Avatar';
import {useOscarAppContext} from '../providers/AppContext';
import {useSuspenseQuery} from '@tanstack/react-query';
import {myUserDataOptions} from '../hooks/dataOptions';
import {Suspense} from 'react';

import {ErrorBoundary} from 'react-error-boundary';

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

const FallbackAvatar = ({username}: {username: string}) => (
  <Avatar>{username?.charAt(0).toUpperCase()}</Avatar>
);

export function UserAvatar({
  userId,
  username,
}: {
  userId: UserId;
  username: string;
}) {
  const response = useSuspenseQuery(myUserDataOptions(userId));
  const propic = response.data?.propic;
  if (!propic) {
    return <Avatar>{username?.charAt(0).toUpperCase()}</Avatar>;
  }
  return <Avatar src={propic} />;
}
