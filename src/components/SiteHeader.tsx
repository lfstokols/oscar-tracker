import React, {useContext, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import UserButton from './UserButton';
import OurWordmark from './OurWordmark';

type Props = {};

export default function SiteHeader(props: Props): React.ReactElement {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Option 1</MenuItem>
            <MenuItem onClick={handleMenuClose}>Option 2</MenuItem>
            <MenuItem onClick={handleMenuClose}>Option 3</MenuItem>
          </Menu>
          <OurWordmark />
        </div>
        <UserButton />
      </Toolbar>
    </AppBar>
  );
}
