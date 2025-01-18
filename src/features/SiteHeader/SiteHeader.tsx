import React, {Suspense, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import MenuIcon from '@mui/icons-material/Menu';
import UserButton from './UserButton';
import OurWordmark from '../../components/OurWordmark';
import Avatar from '@mui/material/Avatar';
import Countdown from '../../components/Countdown';
import {WatchStatus} from '../../types/Enums';
import {MyFill} from '../legacyTable/WatchlistCell';
import YearSelector from './YearSelector';
import TabDrawer from '../tabDrawer/tabDrawer';

import Skeleton from '@mui/material/Skeleton';
import Cookies from 'js-cookie';
import {useIsMobile} from '../../hooks/useIsMobile';

type Props = {};

export default function SiteHeader(props: Props): React.ReactElement {
  const [openDrawer, setOpenDrawer] = useState(false);
  const isMobile = useIsMobile();
  const handleDrawerOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOpenDrawer(true);
  };

  const handleDrawerClose = () => {
    setOpenDrawer(false);
  };

  return (
    <AppBar position="static">
      <Toolbar
        sx={{
          display: 'flex',
          // flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Stack direction="row" alignItems="center">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerOpen}>
            <MenuIcon />
          </IconButton>
          <TabDrawer open={openDrawer} onClose={handleDrawerClose} />
          <OurWordmark mini={isMobile} />
        </Stack>
        <Stack direction="row" alignItems="center" gap="12px">
          <YearSelector />
          <Suspense
            fallback={
              <Avatar>
                {Cookies.get('activeUserId')?.charAt(0).toUpperCase()}
              </Avatar>
            }>
            <UserButton />
          </Suspense>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
