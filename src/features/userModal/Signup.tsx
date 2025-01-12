import React from 'react';
import TitleLine, { boxStyle } from './Formatting';
import TextEntry from './DataEntryField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

type Props = {
  closer:()=>void;
};

export default function SignUp({closer}: Props) {
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (emailError) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
    });
    closer();
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
      setUsernameErrorMessage(
        'Username must consist of only letters and numbers.',
      );
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }
    return isValid;
  };

  return (
    <>
        <TitleLine title="Create an Account" />
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={boxStyle}>
          <TextEntry
            title="Username"
            label="username"
            placeholder="username"
            error={usernameError}
            errorMessage={usernameErrorMessage}
          />
          <TextEntry
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
            color="primary"
            onClick={() => {
              validateEmail() && validateUsername();
            }}>
            Sign Up
          </Button>
        </Box>
    </>
  );
}