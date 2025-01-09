import React, {Suspense, useContext, useState} from 'react';
import {Chip, Button, Avatar} from '@mui/material';
import {useOscarAppContext} from '../contexts/AppContext';
import LoginMenu from './LoginMenu';
import { LoadScreen } from '../App';
import { userOptions } from '../hooks/dataOptions';
import { useQuery } from '@tanstack/react-query';
import UserModal from './userModal/UserModal';
// import {useMyUsers} from '../hooks/useMyQuery';


export default function UserButton(): React.ReactElement {


  // hooks
  const {activeUserId, setActiveUserId, activeUsername} = useOscarAppContext();
  const [isLoggedIn, setIsLoggedIn] = useState(activeUserId !== null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false)


  const handleModal = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleDropdown = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  if (!isLoggedIn) {
    return (
    <>
      <Button variant="contained" onClick={handleDropdown} sx={{mr: 1}} 
      >
      Login
    </Button>
    <Suspense fallback={<LoadScreen />}>
      <LoginMenu anchorEl={anchorEl} setAnchorEl={setAnchorEl} />
    </Suspense>
  </>
  )
}
return (
    <div style={{display: 'flex', alignItems: 'center'}}>
        <>
          <Chip
            avatar={
              <Avatar>
                {activeUsername?.charAt(0).toUpperCase()}
              </Avatar>
            }
            onClick={handleModal}
            label={ activeUsername}
            color="secondary"
            sx={{mr: 1}}
          />
          <UserModal state={[isMenuOpen, setIsMenuOpen]} />
        </>
    </div>
  );
}