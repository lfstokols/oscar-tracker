import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import {styled} from '@mui/material/styles';
//import AppTheme from "../shared-theme/AppTheme";
import {useOscarAppContext} from '../../contexts/AppContext';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Backdrop from '@mui/material/Backdrop';
import OurWordmark from '../OurWordmark';

const Card = styled(MuiCard)(({theme}) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const ActiveUserDataContainer = styled(Stack)(({theme}) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

type Props = {
  state: [boolean, (open: boolean) => void];
};

export default function ActiveUserMenu(props: Props) {
  //const [emailError, setEmailError] = React.useState(false);
  //const [letterboxdDataOpen, setLetterboxdDataOpen] = React.useState(false);
  //const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [isOpen, setIsOpen] = props.state;
  const {setActiveUserId, activeUserId, preferences, activeUsername} =
    useOscarAppContext();

  const handleClickOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from reaching the backdrop
  };

  const handleLogout = () => {
    setActiveUserId(null);
    setIsOpen(false);
  };

  return (
    //<AppTheme {...props}>
    //<CssBaseline enableColorScheme />
    <Backdrop
      sx={theme => ({
        color: '#fff',
        opacity: 1,
        zIndex: theme.zIndex.drawer + 1,
      })}
      open={isOpen}
      onClick={handleClose}>
      <Card
        variant="outlined"
        onClick={handleCardClick}
        color="primary"
        sx={{backgroundColor: 'tertiary.main', borderRadius: '2ch'}}>
        <OurWordmark />
        <Typography
          component="h1"
          variant="h4"
          sx={{width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)'}}
          color="primary"
          fontWeight="bold"
          textAlign="center">
          {activeUsername}
        </Typography>
        <Box
          component="form"
          //onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}>
          <MyForm
            title="Letterboxd"
            label="letterboxd_username"
            placeholder="your username here"
            error={false}
            errorMessage=""
          />
          {/*<FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />*/}
          {/*<ForgotPassword open={open} handleClose={handleClose} />*/}

          {/*<Link
            component="button"
            type="button"
            onClick={handleClickOpen}
            variant="body2"
            sx={{ alignSelf: 'center' }}
          >
            Forgot your password?
          </Link>*/}
        </Box>
        <Divider />
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
          <Typography sx={{textAlign: 'center'}}>Preferences:</Typography>
          <List
            sx={{width: '100%', maxWidth: 360, bgcolor: 'background.paper'}}>
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
        <Button variant="outlined" size="small" sx={{width: '100%'}} color="error" onClick={handleLogout}>Logout</Button>
      </Card>
    </Backdrop>
    //</AppTheme>
  );
}

function MyForm({
  title,
  label,
  placeholder,
  error,
  errorMessage,
}: {
  title: string;
  label: string;
  placeholder: string;
  error: boolean;
  errorMessage: string;
}): React.ReactElement {
  return (
    <FormControl>
      <FormLabel htmlFor={label}>{title}</FormLabel>
      <TextField
        error={error}
        helperText={errorMessage}
        id={label}
        type="text"
        name={label}
        placeholder={placeholder}
        autoFocus
        required
        fullWidth
        variant="outlined"
        color={error ? 'error' : 'primary'}
      />
    </FormControl>
  );
}

//   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     if (emailError) {
//       event.preventDefault();
//       return;
//     }
//     const data = new FormData(event.currentTarget);
//     console.log({
//       email: data.get('email'),
//       password: data.get('password'),
//     });
//   };

//   return (
//     <FormControl>
//       <FormLabel htmlFor="email">Email</FormLabel>
//       <TextField
//         error={emailError}
//         helperText={emailErrorMessage}
//         id="email"
//         type="email"
//         name="email"
//         placeholder="your@email.com"
//         autoComplete="email"
//         autoFocus
//         required
//         fullWidth
//         variant="outlined"
//         color={emailError ? 'error' : 'primary'}
//       />
//     </FormControl>
//   );
// }

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
