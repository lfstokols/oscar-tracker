import {
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {useNavigate, useLocation} from 'react-router-dom';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ViewListIcon from '@mui/icons-material/ViewList';
import React from 'react';
import {AppTabType} from '../../types/Enums';
import {useOscarAppContext} from '../../providers/AppContext';

function tabDisplayName(tab: AppTabType) {
  switch (tab) {
    case AppTabType.byCategory:
      return 'Category Stats';
    case AppTabType.byUser:
      return 'Stats by User';
    case AppTabType.legacy:
      return 'Main Page';
  }
}

export default function TabDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // const {selectedTab, setSelectedTab} = useOscarAppContext();
  // const onTabChange = (tab: AppTabType) => {
  //   setSelectedTab(tab);
  //   onClose();
  // };
  const navigate = useNavigate();
  const location = useLocation();
  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/legacy':
        return AppTabType.legacy;
      case '/users':
        return AppTabType.byUser;
      case '/categories':
        return AppTabType.byCategory;
      default:
        return AppTabType.legacy;
    }
  };
  const handleTabClick = (tab: AppTabType) => {
    switch (tab) {
      case AppTabType.legacy:
        navigate('/legacy');
        break;
      case AppTabType.byUser:
        navigate('/users');
        break;
      case AppTabType.byCategory:
        navigate('/categories');
        break;
    }
    onClose();
  };

  const DrawerList = (
    <Box sx={{width: 250}} role="presentation" onClick={onClose}>
      <Typography variant="h4" sx={{ml: 8}}>
        Tabs
      </Typography>
      <Divider />
      <List>
        {Object.values(AppTabType).map((tab: AppTabType) => (
          <ListItem key={tabDisplayName(tab)} disablePadding>
            <ListItemButton
              onClick={() => handleTabClick(tab)}
              selected={getCurrentTab() === tab}>
              <ListItemIcon>
                {tab === AppTabType.legacy ? (
                  <ChecklistIcon />
                ) : (
                  <ViewListIcon />
                )}
              </ListItemIcon>
              <ListItemText primary={tabDisplayName(tab)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer open={open} onClose={onClose}>
      {DrawerList}
    </Drawer>
  );
}
