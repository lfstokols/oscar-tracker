import React from 'react';
import {useOscarAppContext} from '../../globalProviders/AppContext';
import TitleLine, {Divider, boxStyle} from './Formatting';
import TextEntry from './DataEntryField';
import {useNotifications} from '../../globalProviders/NotificationContext';
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
} from '@mui/material';

type Props = {
  closer: () => void;
};

export default function UserProfile({closer}: Props) {
  const {setActiveUserId, activeUserId, preferences, activeUsername} =
    useOscarAppContext();
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
      <TitleLine title="User Profile" />
      <Box component="form" noValidate sx={boxStyle}>
        <TextEntry
          title="Letterboxd"
          label="letterboxd_username"
          placeholder="your username here"
          error={false}
          errorMessage=""
        />
      </Box>
      <Divider />
      <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
        <Typography sx={{textAlign: 'center'}}>Preferences:</Typography>
        <List sx={{width: '100%', maxWidth: 360, bgcolor: 'background.paper'}}>
          <Preference
            text="Count each 'shorts' category as a single film for counting purposes"
            whichPref="shortsAreOneFilm"
          />
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
