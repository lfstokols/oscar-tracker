import {Error} from '@mui/icons-material';
import {Button, CircularProgress, Menu, MenuItem} from '@mui/material';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Suspense} from 'react';
import * as React from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {userOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
// import {useMyUsers} from '../hooks/useMyQuery';

type Props = {
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  signupOpener: () => void;
};

export default function LoginMenu({
  anchorEl,
  setAnchorEl,
  signupOpener,
}: Props): React.ReactElement {
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      onClose={handleMenuClose}
      open={Boolean(anchorEl)}
      sx={{display: 'flex'}}>
      <ErrorBoundary fallback={<Error />}>
        <Suspense fallback={<LoadingSpinner />}>
          <LoginMenuUserItems onMenuClose={handleMenuClose} />
        </Suspense>
      </ErrorBoundary>
      <MenuItem
        onClick={() => {
          handleMenuClose();
          signupOpener();
        }}>
        <Button
          // onClick={signupOpener}
          size="small"
          sx={{mr: 1}}
          variant="outlined">
          Sign Up
        </Button>
      </MenuItem>
    </Menu>
  );
}

function LoginMenuUserItems(props: {
  onMenuClose: () => void;
}): React.ReactElement[] {
  const {setActiveUserId} = useOscarAppContext();
  const {data: users} = useSuspenseQuery(userOptions());

  return users.map(user => (
    <MenuItem
      key={user.id}
      onClick={() => {
        setActiveUserId(user.id);
        props.onMenuClose();
      }}
      sx={{ml: 1}}>
      {user.username}
    </MenuItem>
  ));
}

function LoadingSpinner() {
  return <CircularProgress color="inherit" />;
}
