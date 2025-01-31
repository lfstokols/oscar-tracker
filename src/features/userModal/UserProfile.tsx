import {DeleteForever} from '@mui/icons-material';
import ErrorIcon from '@mui/icons-material/Error';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import * as React from 'react';
import DefaultCatcher from '../../components/LoadScreen';
import UserAvatar from '../../components/userAvatar';
import {myUserDataOptions, userOptions} from '../../hooks/dataOptions';
import {
  deleteUserMutationFn,
  onMutateError,
  updateCacheOnSuccess,
} from '../../hooks/mutationOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {useNotifications} from '../../providers/NotificationContext';
import {UserListSchema} from '../../types/APIDataSchema';
import {errorToConsole} from '../../utils/Logger';
import TitleLine, {Divider, boxStyle} from './Common';
import UserDataField from './UserDataField';
import LetterboxdField from './letterboxd/LetterboxdField';
type Props = {
  closer: () => void;
};

export default function UserProfile({closer}: Props) {
  const {setActiveUserId, activeUserId, activeUsername} = useOscarAppContext();
  if (!activeUserId || !activeUsername) {
    throw new Error(
      `Opened full user profile, even though activeUserId or activeUsername is null.
      activeUserId: ${activeUserId}, activeUsername: ${activeUsername}`,
    );
  }
  const myUserData = useSuspenseQuery(myUserDataOptions(activeUserId)).data;
  const notifications = useNotifications();
  const queryClient = useQueryClient();
  const deletionMutation = useMutation({
    mutationFn: deleteUserMutationFn(activeUserId, 'forRealsies'),
    onSuccess: () => {
      updateCacheOnSuccess(
        userOptions().queryKey,
        UserListSchema.parse,
        queryClient,
      );
      setActiveUserId(null);
    },
    onError: onMutateError('Failed to delete account', notifications),
  });
  const handleLogout = () => {
    notifications.show({
      type: 'success',
      message: 'Logged out',
    });
    setActiveUserId(null);
    closer();
  };
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = React.useState(false);
  const handleCloseDeleteDialog = () => {
    setDeleteDialogIsOpen(false);
  };
  const handleDelete = () => {
    setDeleteDialogIsOpen(true);
  };
  const handleDeleteConfirmed = () => {
    deletionMutation.mutate(activeUserId);
    if (deletionMutation.isSuccess) {
      notifications.show({
        type: 'success',
        message: 'Account deleted',
      });
      setDeleteDialogIsOpen(false);
      closer();
    }
  };

  return (
    <>
      <Stack direction="row" gap={1} justifyContent="center">
        <div style={{marginTop: '2px'}}>
          <UserAvatar userId={activeUserId} username={activeUsername} />
        </div>
        <TitleLine title={activeUsername} />
      </Stack>
      <Box component="menu" sx={boxStyle}>
        <DefaultCatcher>
          <UserDataField
            editableComponent={placeholderEditableComponent}
            editableComponentProps={{}}
            label="Username"
            localValue={myUserData.username}
            remoteValue={myUserData.username}
          />
          <UserDataField
            editableComponent={placeholderEditableComponent}
            editableComponentProps={{}}
            label="Email"
            localValue={myUserData.email ?? 'Not Set'}
            remoteValue={myUserData.email ?? 'Not Set'}
          />
          <LetterboxdField />
        </DefaultCatcher>
      </Box>
      <Divider />
      <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
        <Typography sx={{textAlign: 'center'}}>Preferences:</Typography>
        <List sx={{width: '100%', maxWidth: 360, bgcolor: 'background.paper'}}>
          <Preference
            text="Treat each 'shorts' category as a single film when calculating cumulative stats"
            whichPref="shortsAreOneFilm"
          />
          <Preference
            text="Highlight 'Best Animated Film' nominees in the main table"
            whichPref="highlightAnimated"
          />
          <Preference
            text="Disallow manual marking movies as 'seen' (giving letterboxd full control)"
            whichPref="lockSeenToggle"
          />
        </List>
      </Box>
      <Divider />
      <Stack spacing={2}>
        <Button
          color="warning"
          onClick={handleLogout}
          size="small"
          sx={{width: '100%'}}
          variant="outlined">
          Logout
        </Button>
        <Button
          color="error"
          onClick={handleDelete}
          size="small"
          sx={{width: '100%'}}
          variant="outlined">
          <DeleteForever sx={{marginRight: 1}} />
          Delete Account
          <DeleteForever sx={{marginLeft: 1}} />
        </Button>
      </Stack>
      <Dialog onClose={handleCloseDeleteDialog} open={deleteDialogIsOpen}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action is
            irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteConfirmed}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Preference({
  text,
  whichPref,
}: {
  text: string;
  whichPref: keyof Preferences;
}): React.ReactElement {
  const {preferences, setPreferences} = useOscarAppContext();
  const [prefState, setPrefState] = [
    preferences[whichPref],
    (newValue: boolean) => {
      setPreferences({...preferences, [whichPref]: newValue});
    },
  ];
  if (typeof prefState !== 'boolean') {
    errorToConsole(
      `Preference ${whichPref} is not a boolean, it can't be set with a checkbox`,
    );
    throw new Error(`Preference ${whichPref} is not a boolean: ${JSON.stringify(prefState)}`);
  }
  const handleToggle = () => {
    setPrefState(!prefState);
  };

  return (
    <ListItem key={whichPref} disablePadding>
      <ListItemButton dense onClick={handleToggle} role={undefined}>
        <ListItemIcon>
          <Checkbox
            checked={prefState}
            disableRipple
            edge="end"
            inputProps={{'aria-labelledby': whichPref}}
            tabIndex={-1}
          />
        </ListItemIcon>
        <ListItemText id={whichPref} primary={text} />
      </ListItemButton>
    </ListItem>
  );
}

function placeholderEditableComponent({
  onCancel,
  activeUserId: _activeUserId,
}: {
  onCancel: () => void;
  activeUserId: UserId;
}) {
  return (
    <Stack direction="row" spacing={2}>
      <ErrorIcon />
      <Typography>This is a placeholder, lol</Typography>
      <Button onClick={onCancel}>Cancel</Button>
    </Stack>
  );
}
