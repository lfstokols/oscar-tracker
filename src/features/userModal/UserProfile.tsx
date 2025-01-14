import React from 'react';
import {useOscarAppContext} from '../../providers/AppContext';
import TitleLine, {Divider, boxStyle} from './Common';
import ErrorIcon from '@mui/icons-material/Error';
import {useNotifications} from '../../providers/NotificationContext';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  Stack,
} from '@mui/material';
import LetterboxdField from './letterboxd/LetterboxdField';
import DefaultCatcher from '../../components/LoadScreen';
import UserAvatar from '../../components/userAvatar';
import UserDataField from './UserDataField';
import {useSuspenseQuery} from '@tanstack/react-query';
import {myUserDataOptions} from '../../hooks/dataOptions';

type Props = {
  closer: () => void;
};

export default function UserProfile({closer}: Props) {
  const {setActiveUserId, activeUserId, preferences, activeUsername} =
    useOscarAppContext();
  if (!activeUserId || !activeUsername) {
    throw new Error(
      `Opened full user profile, even though activeUserId or activeUsername is null.
      activeUserId: ${activeUserId}, activeUsername: ${activeUsername}`,
    );
  }
  const myUserData = useSuspenseQuery(myUserDataOptions(activeUserId)).data;
  const notifications = useNotifications();
  const handleLogout = () => {
    notifications.show({
      type: 'success',
      message: 'Logged out',
    });
    setActiveUserId(null);
    closer();
  };

  return (
    <>
      <TitleLine title={activeUsername ?? 'User Profile'} />
      <UserAvatar userId={activeUserId} username={activeUsername} />
      <Box component="menu" sx={boxStyle}>
        <DefaultCatcher>
          <UserDataField
            label="Username"
            value={myUserData?.username ?? 'Not Set'}
            editableComponent={placeholderEditableComponent}
          />
          <UserDataField
            label="Email"
            value={myUserData?.email ?? 'Not Set'}
            editableComponent={placeholderEditableComponent}
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
        </List>
      </Box>
      <Divider />
      <Button
        variant="outlined"
        size="small"
        sx={{width: '100%'}}
        color="error"
        onClick={handleLogout}>
        Logout
      </Button>
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
  // const [checked, setChecked] = React.useState(prefState);
  React.useEffect(() => {
    prefState;
  }, [prefState]);

  const handleToggle = () => {
    setPrefState(!prefState);
  };

  return (
    <ListItem key={whichPref} disablePadding>
      <ListItemButton role={undefined} onClick={handleToggle} dense>
        <ListItemIcon>
          <Checkbox
            edge="end"
            checked={prefState}
            tabIndex={-1}
            disableRipple
            inputProps={{'aria-labelledby': whichPref}}
          />
        </ListItemIcon>
        <ListItemText id={whichPref} primary={text} />
      </ListItemButton>
    </ListItem>
  );
}

function placeholderEditableComponent({onCancel}: {onCancel: () => void}) {
  return (
    <Stack direction="row" spacing={2}>
      <ErrorIcon />
      <Button onClick={onCancel}>Cancel</Button>
    </Stack>
  );
}
