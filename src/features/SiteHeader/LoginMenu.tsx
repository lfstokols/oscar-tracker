import React, {Suspense} from 'react';
import {CircularProgress, Menu, MenuItem} from '@mui/material';
import {useOscarAppContext} from '../../providers/AppContext';
import {Button} from '@mui/material';
// import {useMyUsers} from '../hooks/useMyQuery';
import DefaultCatcher, {LoadScreen} from '../../components/LoadScreen';
import {Error} from '@mui/icons-material';
import {userOptions} from '../../hooks/dataOptions';
import {ErrorBoundary} from 'react-error-boundary';
import {
  QueryErrorResetBoundary,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

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
      sx={{display: 'flex'}}
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
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
          variant="outlined"
          // onClick={signupOpener}
          size="small"
          sx={{mr: 1}}>
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

const LoadingSpinner = () => <CircularProgress color="inherit" />;
