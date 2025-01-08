import React from 'react';
import {Menu, MenuItem} from '@mui/material';
import {useOscarAppContext} from '../contexts/AppContext';
import {Button} from '@mui/material';
// import {useMyUsers} from '../hooks/useMyQuery';
import {LoadScreen} from '../App';
import {Error} from '@mui/icons-material';
import { userOptions } from '../hooks/dataOptions';
import { useQuery } from '@tanstack/react-query';

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
  const usersPromise = useQuery(userOptions());
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
          }}
          sx = {{ml:1}}>
          {user.username}
        </MenuItem>
      ))}
      <MenuItem>
        <Button variant="outlined" onClick={()=>{}} size="small" sx={{mr: 1}}>
          Sign Up
        </Button>
        </MenuItem>
    </Menu>
  );
}
