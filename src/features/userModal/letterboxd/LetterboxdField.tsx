import * as React from 'react';
import {z} from 'zod';
import {
  useMutation,
  useSuspenseQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {myUserDataOptions} from '../../../hooks/dataOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import LetterboxdSearchBar from './SearchBar';
import {
  updateCacheOnSuccess,
  updateUserMutationFn,
  onMutateError,
} from '../../../hooks/mutationOptions';
import {MyUserDataSchema} from '../../../types/APIDataSchema';
import {useNotifications} from '../../../providers/NotificationContext';
import UserDataField from '../UserDataField';

export default function LetterboxdField() {
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const {activeUserId} = useOscarAppContext();
  if (activeUserId === null)
    throw new Error('Loading Letterboxd field with no active user. How?');
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
  const {data} = useSuspenseQuery(myUserDataOptions(activeUserId));

  return (
    <UserDataField
      editableComponent={EditableLetterboxdField}
      editableComponentProps={{
        mutation: mutation,
      }}
      label="Letterboxd"
      localValue={
        mutation.isPending ? mutation.variables.letterboxd : data.letterboxd
      }
      remoteValue={data.letterboxd}
    />
  );
}

//   const {activeUserId} = useOscarAppContext();
//   if (activeUserId === null)
//     throw new Error('Loading Letterboxd field with no active user. How?');
//   const {data, isError} = useSuspenseQuery(myUserDataOptions(activeUserId));
//   if (isError) {
//     return <ErrorIcon />;
//   }
//   const mutation = useMutation({
//     mutationFn: updateUserMutationFn(),
//     onSuccess: updateCacheOnSuccess(
//       myUserDataOptions(activeUserId).queryKey,
//       MyUserDataSchema.parse,
//       queryClient,
//     ),
//     onError: onMutateError(
//       'Failed to update letterboxd username.',
//       notifications,
//     ),
//   });
//   const remoteValue = data.letterboxd;
//   const localValue = mutation.isPending
//     ? mutation.variables.letterboxd
//     : remoteValue;
//   const [isEditing, setIsEditing] = React.useState(false);
//   if (isEditing) {
//     return (
//       <EditableLetterboxdField
//         activeUserId={activeUserId}
//         mutation={mutation}
//         onCancel={() => setIsEditing(false)}
//       />
//     );
//   }
//   return (
//     <Stack direction="row" spacing={4}>
//       <Typography variant="h6" gutterBottom>
//         Letterboxd:
//       </Typography>
//       <Typography variant="body1">
//         {localValue ? localValue : 'Not Set'}
//       </Typography>
//       <Button variant="contained" onClick={() => setIsEditing(true)}>
//         Edit
//       </Button>
//     </Stack>
//   );
// }

function EditableLetterboxdField({
  activeUserId: _activeUserId,
  mutation,
  onCancel,
}: {
  activeUserId: UserId;
  mutation: ReturnType<
    typeof useMutation<
      Response,
      unknown,
      Partial<z.input<typeof MyUserDataSchema>>
    >
  >;
  onCancel: () => void;
}): React.ReactNode {
  const [letterboxdId, setLetterboxdId] = React.useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({letterboxd: letterboxdId});
    onCancel();
  };

  return (
    <Card component="form" onSubmit={handleSubmit} sx={{padding: 2}}>
      <Stack direction="column" spacing={2}>
        <LetterboxdSearchBar setter={setLetterboxdId} />
        <Stack direction="row" spacing={2}>
          <Button
            onClick={() => {
              mutation.mutate({letterboxd: letterboxdId});
              onCancel();
            }}
            variant="contained">
            Submit
          </Button>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
