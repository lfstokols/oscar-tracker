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
import { styled } from '@mui/material/styles';
//import { GoogleIcon, FacebookIcon, SitemarkIcon } from './CustomIcons';
//import AppTheme from "../shared-theme/AppTheme";
//import ColorModeSelect from '../shared-theme/ColorModeSelect';
import OurWordmark from '../../components/OurWordmark';
import Backdrop from '@mui/material/Backdrop';

const Card = styled(MuiCard)(({ theme }) => ({
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

const ActiveUserDataContainer = styled(Stack)(({ theme }) => ({
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
  open: boolean;
  setOpen: (open: boolean) => void;
};

export default function SignUpMenu({open, setOpen}: Props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCardClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from reaching the backdrop
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (emailError) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
    });
  };

  const validateEmail = () => {
    const email = document.getElementById('email') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }
    return isValid;
  };

  const validateUsername = () => {
    const username = document.getElementById('username') as HTMLInputElement;

    let isValid = true;
    if (!username.value || !/^[a-zA-Z0-9]+$/.test(username.value)) {
      setUsernameError(true);
      setUsernameErrorMessage('Username must consist of only letters and numbers.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }
    return isValid;
  }



  return (
    //<AppTheme {...props}>
    //<CssBaseline enableColorScheme />
    <Backdrop
    sx={(theme) => ({ color: '#fff', opacity: 1, zIndex: theme.zIndex.drawer + 1 })}
    open={open}
    onClick={handleClose}
  >
    {/* <ActiveUserDataContainer direction="column" justifyContent="space-between"> */}
      <Card variant="outlined" onClick={handleCardClick}>
        <OurWordmark />
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          Create an Account
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <MyForm 
            title="Username"
            label="username"
            placeholder="username"
            error={usernameError}
            errorMessage={usernameErrorMessage}
          />
          <MyForm
            title="Email"
            label="email"
            placeholder="your@email.com"
            error={emailError}
            errorMessage={emailErrorMessage}
          />
          {/*<FormControlLabel
						control={<Checkbox value="remember" color="primary" />}
						label="Remember me"
					/>
					<ForgotPassword open={open} handleClose={handleClose} />*/}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={()=>{validateEmail() && validateUsername()}}
          >
            Sign Up
          </Button>
          {/*<Link
						component="button"
						type="button"
						onClick={handleClickOpen}
						variant="body2"
						sx={{ alignSelf: "center" }}
					>
						Forgot your password?
					</Link>*/}
        </Box>
        {/* <Divider>or</Divider> */}
        {/*<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => alert('Sign in with Google')}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => alert('Sign in with Facebook')}
            startIcon={<FacebookIcon />}
          >
            Sign in with Facebook
          </Button>
          <Typography sx={{ textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/material-ui/getting-started/templates/sign-in/"
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>*/}
      </Card>
    {/* </ActiveUserDataContainer> */}
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
        type='text'
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
