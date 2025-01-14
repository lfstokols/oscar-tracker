import * as React from 'react';
import {z} from 'zod';
import {
  useMutation,
  useSuspenseQuery,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import {myUserDataOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorIcon from '@mui/icons-material/Error';
import {
  updateCacheOnSuccess,
  updateUserMutationFn,
  onMutateError,
} from '../../hooks/mutationOptions';
import {MyUserDataSchema} from '../../types/APIDataSchema';
import {useNotifications} from '../../providers/NotificationContext';

type Props = {
  label: string;
  value: string | null;
  // mutation: UseMutationResult<
  //   Response,
  //   unknown,
  //   Partial<z.input<typeof MyUserDataSchema>>
  // >;
  // optimisticValue: string | Promise<string>;
  editableComponent: (props: {
    [any: string]: any;
    // activeUserId: UserId;
    // mutation: any;
    onCancel: () => void;
  }) => React.ReactNode;
};

export default function UserDataField(props: Props) {
  const {activeUserId} = useOscarAppContext();
  if (activeUserId === null)
    throw new Error('Loading UserDataField with no active user. How?');
  const {data, isError} = useSuspenseQuery(myUserDataOptions(activeUserId));
  if (isError) {
    return <ErrorIcon />;
  }
  const [isEditing, setIsEditing] = React.useState(false);
  // const mutation = props.mutation;
  const remoteValue = props.value;
  const localValue = remoteValue; //mutation.isPending ? props.optimisticValue : remoteValue;
  if (isEditing) {
    return (
      <props.editableComponent
        // activeUserId={activeUserId}
        // mutation={mutation}
        onCancel={() => setIsEditing(false)}
      />
    );
  }
  return (
    <Stack direction="row" spacing={4}>
      <Typography variant="h6" gutterBottom>
        {props.label}:
      </Typography>
      <Typography variant="body1">
        {localValue ? localValue : 'Not Set'}
      </Typography>
      <Button variant="contained" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
    </Stack>
  );
}
