import React from 'react';
import TitleLine, {boxStyle} from './Common';
import TextEntry from './DataEntryField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {useNotifications} from '../../providers/NotificationContext';
import {addUserOnSuccess, onMutateError} from '../../hooks/mutationOptions';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {addUserMutationFn} from '../../hooks/mutationOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import Tooltip from '@mui/material/Tooltip';

type Props = {
  closer: () => void;
};

export default function SignUp({closer}: Props) {
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const notifications = useNotifications();
  const queryClient = useQueryClient(); // TODO - move this to a global provider?
  const setActiveUserId = useOscarAppContext().setActiveUserId;
  const mutation = useMutation({
    mutationFn: addUserMutationFn(),
    onSuccess: addUserOnSuccess(queryClient, setActiveUserId),
    onError: onMutateError('Failed to create user.', notifications),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (emailError || usernameError) {
      event.preventDefault();
      return;
    }

    const data = new FormData(event.currentTarget);
    mutation.mutate({
      username: data.get('username') as string,
      data: {
        email: data.get('email') as string,
      },
    });
    closer();
  };

  const validateEmail = () => {
    const email = document.getElementById('email') as HTMLInputElement;

    let isValid = true;

    if (email.value && !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("That's not a valid email address.");
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
    if (!username.value || !/^[a-zA-Z0-9_]+$/.test(username.value)) {
      setUsernameError(true);
      setUsernameErrorMessage(
        'Username must consist of only letters, numbers, and underscores.',
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
      <Box component="form" onSubmit={handleSubmit} noValidate sx={boxStyle}>
        <Tooltip title="Username must consist of only letters, numbers, and underscores.">
          <TextEntry
            title="Username"
            label="username"
            placeholder="username"
            error={usernameError}
            errorMessage={usernameErrorMessage}
          />
        </Tooltip>
        <Tooltip title="This is optional, I included it to look more professional.">
          <TextEntry
            title="Email"
            label="email"
            placeholder="your@email.com"
            error={emailError}
            errorMessage={emailErrorMessage}
          />
        </Tooltip>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => {
            validateEmail();
            validateUsername();
          }}>
          Sign Up
        </Button>
      </Box>
    </>
  );
}
