import * as React from 'react';
import {z} from 'zod';
import {useMutation, useSuspenseQuery, useQueryClient, UseMutationResult} from '@tanstack/react-query';
import {myUserDataOptions} from '../../../hooks/dataOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorIcon from '@mui/icons-material/Error';
import LetterboxdSearchBar from './searchbar';
import {
  updateCacheOnSuccess,
  updateUserMutationFn,
  onMutateError,
} from '../../../hooks/mutationOptions';
import {MyUserDataSchema} from '../../../types/APIDataSchema';
import { useNotifications } from '../../../providers/NotificationContext';

export default function LetterboxdField() {
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const {activeUserId} = useOscarAppContext();
  if (activeUserId === null)
    throw new Error('Loading Letterboxd field with no active user. How?');
  const {data, isError} = useSuspenseQuery(myUserDataOptions(activeUserId));
  if (isError) {
    return <ErrorIcon />;
  }
  const mutation = useMutation({
    mutationFn: updateUserMutationFn(),
    onSuccess: updateCacheOnSuccess(
      myUserDataOptions(activeUserId).queryKey,
      MyUserDataSchema.parse,
      queryClient,
    ),
    onError: onMutateError(
      'Failed to update letterboxd username.',
      notifications,
    ),
  });
  const remoteValue = data.letterboxd;
  const localValue = mutation.isPending ? mutation.variables.letterboxd : remoteValue;
  const [isEditing, setIsEditing] = React.useState(false);
  if (isEditing) {
    return (
      <EditableLetterboxdField
        activeUserId={activeUserId}
        mutation={mutation}
      />
    );
  }
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="h6">Letterboxd:</Typography>
      {localValue ? (
        <Typography variant="body1">{localValue}</Typography>
      ) : (
        <Typography variant="body1">Not set</Typography>
      )}
      <Button variant="contained" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
    </Stack>
  );
}

function EditableLetterboxdField({
  activeUserId,
  mutation,
}: {
  activeUserId: UserId;
  mutation: ReturnType<typeof useMutation<Response, unknown, Partial<z.input<typeof MyUserDataSchema>>>>;
}): React.ReactNode {

  const [letterboxdId, setLetterboxdId] = React.useState<string | null>(null);

  return (
    <Card>
      <Stack direction="row" spacing={2}>
        <LetterboxdSearchBar setter={setLetterboxdId} />
        <Button
          variant="contained"
          onClick={() => {
            mutation.mutate({letterboxd: letterboxdId});
          }}>
          Submit
        </Button>
      </Stack>
    </Card>
  );
}
