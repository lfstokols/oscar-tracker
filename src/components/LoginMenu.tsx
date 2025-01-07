import React from 'react';
import {Menu, MenuItem} from '@mui/material';
import {useOscarAppContext} from '../contexts/AppContext';
import useData from '../hooks/useData';

type Props = {
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
};

export default function LoginMenu({
  anchorEl,
  setAnchorEl,
}: Props): React.ReactElement {
  // Make login menu elements
  const {setActiveUserId} = useOscarAppContext();
  const fromFetch = useData(useOscarAppContext().year);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  if (fromFetch.isPending) {
    return <div>Loading...</div>;
  }
  if (fromFetch.isError) {
    return <div>Error: Can't load usernames</div>;
  }
  if (!fromFetch.allData || !fromFetch.allData.users) {
    return (
      <div>
        No data. It isn't possible to see this message, text Logan if you read
        it.
      </div>
    );
  }
  const users = fromFetch.allData.users;
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
      {users.map(user => (
        <MenuItem
          key={user.id}
          onClick={() => {
            setActiveUserId(user.id);
            handleMenuClose();
          }}>
          {user.username}
        </MenuItem>
      ))}
    </Menu>
  );
}
