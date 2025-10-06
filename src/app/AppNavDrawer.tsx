import {BugReport, Comment, Home, Hub, Leaderboard} from '@mui/icons-material';
import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import {Location, useLocation, useNavigate} from 'react-router-dom';
import {
  BY_CATEGORY_URL,
  BY_USER_URL,
  FEATURE_REQUEST_URL,
  LEGACY_URL,
  REPORT_BUG_URL,
} from '../config/GlobalConstants';
import YearSelector from '../features/app_header/YearSelector';
import {useIsMobile} from '../hooks/useIsMobile';
import {useOscarAppContext} from '../providers/AppContext';
import {AppTabType} from '../types/Enums';
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
        void navigate(`/${LEGACY_URL}/${year}`);
        break;
      case AppTabType.byUser:
        void navigate(`/${BY_USER_URL}/${year}`);
        break;
      case AppTabType.byCategory:
        void navigate(`/${BY_CATEGORY_URL}/${year}`);
        break;
    }
    if (!isDrawerPersistent) {
      onClose();
    }
  };

  return (
    <Drawer
      onClick={isDrawerPersistent ? undefined : onClose}
      onClose={onClose}
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
      variant={isDrawerPersistent ? 'persistent' : 'temporary'}>
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
        {!!isMobile && (
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
