import Avatar from '@mui/material/Avatar';
import {useOscarAppContext} from '../providers/AppContext';
import {useSuspenseQuery} from '@tanstack/react-query';
import {myUserDataOptions} from '../hooks/dataOptions';

export default function UserAvatar({
  userId,
  username,
}: {
  userId: UserId;
  username: string;
}) {
  const response = useSuspenseQuery(myUserDataOptions(userId));
  const propic = response.data?.propic ?? null;
  if (response.isError || !propic) {
    return <Avatar>{username?.charAt(0).toUpperCase()}</Avatar>;
  }
  return <Avatar src={propic} />;
}
