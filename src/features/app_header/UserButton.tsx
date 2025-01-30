import React, {useCallback, useState} from 'react';
import {Chip, Button, IconButton} from '@mui/material';
import {useOscarAppContext} from '../../providers/AppContext';
import LoginMenu from './LoginMenu';
import ProfileScreen from '../userModal/ProfileScreen';
import UserAvatar from '../../components/userAvatar';
import {useIsMobile} from '../../hooks/useIsMobile';

export default function UserButton(): React.ReactElement {
  // hooks
  const {activeUserId, activeUsername} = useOscarAppContext();
  const isLoggedIn = activeUserId !== null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isMobile = useIsMobile();

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
        <Button onClick={handleDropdown} sx={{mr: 1}} variant="contained">
          Login
        </Button>
        <LoginMenu
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          signupOpener={openProfile}
        />
        <ProfileScreen closeModal={closeProfile} open={isProfileOpen} />
      </>
    );
  } else {
    const avatar = (
      <UserAvatar userId={activeUserId} username={activeUsername ?? ' '} />
    );
    // if (isMobile) {
    //   return <IconButton onClick={openProfile} />;
    // }
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
        {isMobile ? (
          <IconButton color="secondary" onClick={openProfile}>
            {avatar}
          </IconButton>
        ) : (
          <Chip
            avatar={avatar}
            color="secondary"
            label={activeUsername}
            onClick={openProfile}
          />
        )}
        <ProfileScreen closeModal={closeProfile} open={isProfileOpen} />
      </div>
    );
  }
}
