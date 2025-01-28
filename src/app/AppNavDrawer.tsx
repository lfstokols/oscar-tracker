import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
} from '@mui/material';
import {useNavigate, useLocation, Location} from 'react-router-dom';
import {Leaderboard, Home, Hub, BugReport, Comment} from '@mui/icons-material';
import {AppTabType} from '../types/Enums';
import {FEATURE_REQUEST_URL, REPORT_BUG_URL} from '../config/GlobalConstants';
import YearSelector from '../features/app_header/YearSelector';
import {useIsMobile} from '../hooks/useIsMobile';
import {
  LEGACY_URL,
  BY_USER_URL,
  BY_CATEGORY_URL,
} from '../config/GlobalConstants';
import {useOscarAppContext} from '../providers/AppContext';
export const DRAWER_WIDTH = 256;

function mapLocationToAppTab(location: Location) {
  switch (location.pathname.split('/')[1]) {
    case LEGACY_URL:
      return AppTabType.legacy;
    case BY_USER_URL:
      return AppTabType.byUser;
    case BY_CATEGORY_URL:
      return AppTabType.byCategory;
    default:
      return AppTabType.legacy;
  }
}

function tabDisplayName(tab: AppTabType) {
  switch (tab) {
    case AppTabType.byCategory:
      return 'Breakdown by Category';
    case AppTabType.byUser:
      return 'Leaderboard';
    case AppTabType.legacy:
      return 'Homepage';
  }
}
function tabIcon(tab: AppTabType) {
  switch (tab) {
    case AppTabType.legacy:
      return <Home />;
    case AppTabType.byUser:
      return <Leaderboard />;
    case AppTabType.byCategory:
      return <Hub />;
  }
}

export default function AppNavDrawer({
  open,
  onClose,
  isDrawerPersistent,
}: {
  open: boolean;
  onClose: () => void;
  isDrawerPersistent: boolean;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const {year} = useOscarAppContext();
  const currentTab = mapLocationToAppTab(location);

  const handleTabClick = (tab: AppTabType) => {
    switch (tab) {
      case AppTabType.legacy:
        navigate(`/${LEGACY_URL}/${year}`);
        break;
      case AppTabType.byUser:
        navigate(`/${BY_USER_URL}/${year}`);
        break;
      case AppTabType.byCategory:
        navigate(`/${BY_CATEGORY_URL}/${year}`);
        break;
    }
    if (!isDrawerPersistent) {
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      variant={isDrawerPersistent ? 'persistent' : 'temporary'}
      onClick={isDrawerPersistent ? undefined : onClose}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}>
      <Toolbar />
      {/* <Box
        sx={{width: 250}}
        role="presentation"
        onClick={onClose}
        alignItems="center"> */}
      {/* <Typography variant="h4" sx={{px: 8, py: 2}}>
        Tabs
      </Typography>
      <Divider /> */}
      {/* <Stack
        direction="row"
        justifyContent="end"
        marginTop="8px"
        marginRight="8px">
        <IconButton onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </Stack> */}
      {/* <Divider /> */}

      <List>
        {isMobile && (
          <ListItem key="year-selector">
            <YearSelector />
          </ListItem>
        )}
        {Object.values(AppTabType).map((tab: AppTabType) => (
          <ListItem key={tabDisplayName(tab)} disablePadding>
            <ListItemButton
              onClick={() => handleTabClick(tab)}
              selected={currentTab === tab}>
              <ListItemIcon>{tabIcon(tab)}</ListItemIcon>
              <ListItemText primary={tabDisplayName(tab)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem key="feature-request" disablePadding>
          <ListItemButton
            onClick={() => window.open(FEATURE_REQUEST_URL, '_blank')}>
            <ListItemIcon>
              <Comment />
            </ListItemIcon>
            <ListItemText primary="Request a Feature" />
          </ListItemButton>
        </ListItem>
        <ListItem key="report-bug" disablePadding>
          <ListItemButton onClick={() => window.open(REPORT_BUG_URL, '_blank')}>
            <ListItemIcon>
              <BugReport />
            </ListItemIcon>
            <ListItemText primary="Report a Bug" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
