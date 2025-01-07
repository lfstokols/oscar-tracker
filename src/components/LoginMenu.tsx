import React from 'react';
import {Menu, MenuItem} from '@mui/material';
import {useOscarAppContext} from '../contexts/AppContext';
import {useMyUsers} from '../hooks/useMyQuery';
import {LoadScreen} from '../App';
import {Error} from '@mui/icons-material';

type Props = {
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
};

export default function LoginMenu({
  anchorEl,
  setAnchorEl,
}: Props): React.ReactElement {
  // Make login menu elements
  const {setActiveUserId} = useOscarAppContext();
  const usersPromise = useMyUsers();
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  if (usersPromise.isPending) {
    return <LoadScreen />;
  }
  if (usersPromise.isError) {
    return <Error />;
  }
  if (!usersPromise.data) {
    return (
      <div>
        No data. It isn't possible to see this message, text Logan if you read
        it.
      </div>
    );
  }
  const users = usersPromise.data;
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
      {users.map(user => (
        <MenuItem
          key={user.id}
          onClick={() => {
            setActiveUserId(user.id);
            handleMenuClose();
          }}>
          {user.username}
        </MenuItem>
      ))}
    </Menu>
  );
}
