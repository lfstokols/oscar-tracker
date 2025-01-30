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
import {useState} from 'react';

type Props = {
  closer: () => void;
};

export default function SignUp({closer}: Props) {
  const [usernameError, setUsernameError] = useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
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

    if (email.value && !/\S{1,20}@\S{1,15}\.\S{1,15}/.test(email.value)) {
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
    if (!username.value || !/^[a-zA-Z0-9_]*$/.test(username.value)) {
      setUsernameError(true);
      setUsernameErrorMessage(
        'Username must consist of only letters, numbers, and underscores.',
      );
      isValid = false;
    } else if (username.value.length > 15) {
      setUsernameError(true);
      setUsernameErrorMessage('Max username length is 15 characters.');
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
      <Box component="form" noValidate onSubmit={handleSubmit} sx={boxStyle}>
        {/* <Tooltip title="Username must consist of only letters, numbers, and underscores."> */}
        <TextEntry
          display_name="Username"
          error={usernameError}
          errorMessage={usernameErrorMessage}
          label="username"
          placeholder="username"
        />
        {/* </Tooltip> */}
        {/* <Tooltip title="This is optional, I included it to look more professional."> */}
        <TextEntry
          display_name="Email (optional)"
          error={emailError}
          errorMessage={emailErrorMessage}
          label="email"
          placeholder="your@email.com"
        />
        {/* </Tooltip> */}
        <Button
          color="primary"
          fullWidth
          onClick={() => {
            validateEmail();
            validateUsername();
          }}
          type="submit"
          variant="contained">
          Sign Up
        </Button>
      </Box>
    </>
  );
}
