import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import {Dispatch, SetStateAction, Suspense} from 'react';
import OurWordmark from '../../components/OurWordmark';
import {SITE_HEADER_COLOR} from '../../config/StyleChoices';
import {useIsMobile} from '../../hooks/useIsMobile';
import {getUserIdFromCookie} from '../../utils/CookieManager';
import UserButton from './UserButton';
import YearSelector from './YearSelector';

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
                {getUserIdFromCookie()?.charAt(0).toUpperCase()}
              </Avatar>
            }>
            <UserButton />
          </Suspense>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
