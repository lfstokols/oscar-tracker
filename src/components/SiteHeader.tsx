import React, { useContext, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import { OscarAppContext } from '../contexts/AppContext';
import UserButton from './UserButton';

interface SiteHeaderProps {
}

export default function SiteHeader(): React.ReactElement {
	const title = "Oscar Tracker: Track the Oscars!";
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	return (
		<AppBar position="static">
			<Toolbar>
				<IconButton edge="start" color="inherit" aria-label="menu" onClick={handleMenuOpen}>
					<MenuIcon />
				</IconButton>
				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
				>
					<MenuItem onClick={handleMenuClose}>Option 1</MenuItem>
					<MenuItem onClick={handleMenuClose}>Option 2</MenuItem>
					<MenuItem onClick={handleMenuClose}>Option 3</MenuItem>
				</Menu>
				<Typography variant="h6" style={{ flexGrow: 1 }}>
					{title}
				</Typography>
				<UserButton />
			</Toolbar>
		</AppBar>
	);
};