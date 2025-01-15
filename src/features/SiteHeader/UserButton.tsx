import React, {Suspense, useCallback, useState} from 'react';
import {Chip, Button, Avatar} from '@mui/material';
import {useOscarAppContext} from '../../providers/AppContext';
import LoginMenu from './LoginMenu';
import DefaultCatcher from '../../components/LoadScreen';
import ProfileScreen from '../userModal/ProfileScreen';
import UserAvatar from '../../components/userAvatar';
import {QueryErrorResetBoundary} from '@tanstack/react-query/build/legacy/QueryErrorResetBoundary';

export default function UserButton(): React.ReactElement {
  // hooks
  const {activeUserId, activeUsername} = useOscarAppContext();
  const isLoggedIn = activeUserId !== null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const closeProfile = useCallback(() => {
    setIsProfileOpen(false);
  }, []);
  const openProfile = useCallback(() => {
    setIsProfileOpen(true);
  }, []);
  const handleDropdown = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  if (!isLoggedIn) {
    return (
      <>
        <Button variant="contained" onClick={handleDropdown} sx={{mr: 1}}>
          Login
        </Button>
        <LoginMenu
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          signupOpener={openProfile}
        />
        <ProfileScreen open={isProfileOpen} closeModal={closeProfile} />
      </>
    );
  } else {
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
        <>
          <Chip
            avatar={
              <UserAvatar
                userId={activeUserId}
                username={activeUsername ?? ' '}
              />
            }
            onClick={openProfile}
            label={activeUsername}
            color="secondary"
            sx={{mr: 1}}
          />
          <ProfileScreen open={isProfileOpen} closeModal={closeProfile} />
          {/* <UserModal closer={closeProfile} /> */}
        </>
      </div>
    );
  }
}
