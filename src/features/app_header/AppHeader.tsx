import React, {Dispatch, SetStateAction, Suspense} from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import UserButton from './UserButton';
import OurWordmark from '../../components/OurWordmark';
import Avatar from '@mui/material/Avatar';
import YearSelector from './YearSelector';
import {SITE_HEADER_COLOR} from '../../config/StyleChoices';
import Cookies from 'js-cookie';
import {useIsMobile} from '../../hooks/useIsMobile';

type Props = {
  isDrawerPersistent: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: Dispatch<SetStateAction<boolean>>;
};

export default function AppHeader({
  isDrawerOpen,
  setIsDrawerOpen,
  isDrawerPersistent,
}: Props): React.ReactElement {
  const isMobile = useIsMobile();

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: SITE_HEADER_COLOR,
        zIndex: theme => theme.zIndex.drawer + 1,
      }}>
      <Toolbar
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Stack alignItems="center" direction="row">
          <IconButton
            aria-label="menu"
            color="inherit"
            edge="start"
            onClick={() =>
              setIsDrawerOpen(prevIsDrawerOpen => !prevIsDrawerOpen)
            }>
            {isDrawerPersistent && isDrawerOpen ? (
              <MenuOpenIcon />
            ) : (
              <MenuIcon />
            )}
          </IconButton>
          <OurWordmark mini={isMobile} />
        </Stack>
        <Stack alignItems="center" direction="row" gap="12px">
          {!isMobile && <YearSelector />}
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
