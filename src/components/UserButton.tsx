import React, { useContext, useState } from 'react';
import { Chip, Button, Avatar } from '@mui/material';
import { OscarAppContext } from '../contexts/AppContext';
import { AppTabType } from '../types/Enums';
import useData from '../hooks/useData';
import LoginMenu from './LoginMenu';
import useUsers from '../hooks/useUsers';

export default function UserButton():React.ReactElement {
    // hooks
    const { activeUserId, setActiveUserId } = useContext(OscarAppContext);
    const userData = useUsers().users;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (!userData) {
        return <div>Can't find username</div>;
    }
    const getUsername = userData.reduce((acc:Record<string,string>, user) => {
            acc[user.userId] = user.username;
            return acc;
        }, {})
    const handleUserClick = () => {};
    const logout = () => setActiveUserId(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {activeUserId ? (
                <>
                    <Chip avatar={<Avatar>{getUsername[activeUserId]?.charAt(0).toUpperCase()}</Avatar>} onClick={handleUserClick} label={getUsername[activeUserId]} color="secondary"/>
                    <Button variant="contained" color="secondary" size="small" onClick={logout}>Logout</Button>
                </>
            ) : (
                <>
                    <Button variant="contained" onClick={handleMenuOpen}>Login</Button>
                    <LoginMenu anchorEl={anchorEl} setAnchorEl={setAnchorEl} />
                </>
            )}
        </div>
    );
};