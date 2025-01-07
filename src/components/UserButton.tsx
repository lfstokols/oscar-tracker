import React, {useContext, useState} from 'react';
import {Chip, Button, Avatar} from '@mui/material';
import {useOscarAppContext} from '../contexts/AppContext';
import LoginMenu from './LoginMenu';
import useUsers from '../hooks/useUsers';

export default function UserButton(): React.ReactElement {
  // hooks
  const {activeUserId, setActiveUserId} = useOscarAppContext();
  const userData = useUsers();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (userData.isPending || userData.isError) {
    return <div>Can't find username</div>;
  }
  const getUsername = userData.data.reduce(
    (acc: Record<string, string>, user) => {
      acc[user.id] = user.username;
      return acc;
    },
    {},
  );
  const handleUserClick = () => {};
  const logout = () => setActiveUserId(null);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  return (
    <div style={{display: 'flex', alignItems: 'center'}}>
      {activeUserId ? (
        <>
          <Chip
            avatar={
              <Avatar>
                {getUsername[activeUserId]?.charAt(0).toUpperCase()}
              </Avatar>
            }
            onClick={handleUserClick}
            label={getUsername[activeUserId]}
            color="secondary"
            sx={{mr: 1}}
          />
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={logout}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="contained" onClick={handleMenuOpen} sx={{mr: 1}}>
            Login
          </Button>
          <LoginMenu anchorEl={anchorEl} setAnchorEl={setAnchorEl} />
        </>
      )}
    </div>
  );
}
