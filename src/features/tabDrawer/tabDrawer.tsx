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
import {Leaderboard, Home, Hub, BugReport, Comment} from '@mui/icons-material';
import React from 'react';
import {AppTabType} from '../../types/Enums';
import {useOscarAppContext} from '../../providers/AppContext';

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

export default function TabDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
    <Box
      sx={{width: 250}}
      role="presentation"
      onClick={onClose}
      alignItems="center">
      <Typography variant="h4" sx={{px: 8, py: 2}}>
        Tabs
      </Typography>
      <Divider />
      <List>
        {Object.values(AppTabType).map((tab: AppTabType) => (
          <ListItem key={tabDisplayName(tab)} disablePadding>
            <ListItemButton
              onClick={() => handleTabClick(tab)}
              selected={getCurrentTab() === tab}>
              <ListItemIcon>{tabIcon(tab)}</ListItemIcon>
              <ListItemText primary={tabDisplayName(tab)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() =>
              window.open(
                'https://docs.google.com/forms/d/e/1FAIpQLSdZoo8OeT0y7BPiERtv8rtSA1VFNzG0FhjukGNcrIOQOYxKvw/viewform?usp=dialog',
                '_blank',
              )
            }>
            <ListItemIcon>
              <Comment />
            </ListItemIcon>
            <ListItemText primary="Request a Feature" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() =>
              window.open(
                'https://docs.google.com/forms/d/e/1FAIpQLSdZoo8OeT0y7BPiERtv8rtSA1VFNzG0FhjukGNcrIOQOYxKvw/viewform?usp=dialog',
                '_blank',
              )
            }>
            <ListItemIcon>
              <BugReport />
            </ListItemIcon>
            <ListItemText primary="Report a Bug" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer open={open} onClose={onClose}>
      {DrawerList}
    </Drawer>
  );
}
