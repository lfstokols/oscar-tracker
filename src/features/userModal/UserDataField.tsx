import * as React from 'react';
import {useSuspenseQuery} from '@tanstack/react-query';
import {myUserDataOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import Stack from '@mui/material/Stack';
import ButtonIcon from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';

type Props<T> = {
  label: string;
  remoteValue: string | null;
  localValue: string | null | undefined;
  editableComponent: (
    props: T & {onCancel: () => void; activeUserId: UserId},
  ) => React.ReactNode;
  editableComponentProps: T;
};

export default function UserDataField<T>(props: Props<T>) {
  const {activeUserId} = useOscarAppContext();
  if (activeUserId === null)
    throw new Error('Loading UserDataField with no active user. How?');
  const {data: _data, isError} = useSuspenseQuery(
    myUserDataOptions(activeUserId),
  );
  if (isError) {
    return <ErrorIcon />;
  }
  const [isEditing, setIsEditing] = React.useState(false);
  // const mutation = props.mutation;
  // const remoteValue = props.remoteValue;
  const localValue = props.localValue; //mutation.isPending ? props.optimisticValue : remoteValue;
  if (isEditing) {
    return (
      <props.editableComponent
        activeUserId={activeUserId}
        onCancel={() => setIsEditing(false)}
        {...props.editableComponentProps}
      />
    );
  }
  return (
    <Stack direction="row" alignItems="fill">
      <Typography
        variant="h6"
        sx={{width: '250px', position: 'relative', bottom: '6px'}}>
        {props.label}:
      </Typography>
      <Typography variant="body1" sx={{width: '200px'}}>
        {localValue ? localValue : 'Not Set'}
      </Typography>
      <span style={{flexGrow: 1}} />
      <ButtonIcon
        // variant="contained"
        size="small"
        onClick={() => setIsEditing(true)}>
        <EditIcon />
      </ButtonIcon>
    </Stack>
  );
}
