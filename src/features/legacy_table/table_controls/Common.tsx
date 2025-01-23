import {Button, IconButton, Typography, Menu} from '@mui/material';
import {useState} from 'react';

export function DisplayedSettingsButton({
  onClick,
  isMobile,
  icon,
  text,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isMobile: boolean;
  icon: React.ReactNode;
  text: string;
}): React.ReactElement {
  if (isMobile) {
    return <IconButton onClick={onClick}>{icon}</IconButton>;
  }
  return (
    <Button
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'left',
        flexDirection: 'row',
        gap: '8px',
      }}>
      {icon}
      <Typography>{text}</Typography>
    </Button>
  );
}

export function CenteredMenu({
  menuPosition,
  isOpen,
  onClose,
  children,
}: {
  menuPosition: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Menu
      anchorEl={menuPosition}
      open={isOpen}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}>
      {children}
    </Menu>
  );
}

//* Hook to manage menu state
//* Returns:
//* - isOpen: state of menu
//* - handleClick: (event: React.MouseEvent<HTMLElement>) => void
//* - handleClose: () => void
export function useMenuState(): [
  boolean,
  HTMLElement | null,
  (event: React.MouseEvent<HTMLElement>) => void,
  () => void,
] {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuPosition = anchorEl;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setIsOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsOpen(false);
  };
  return [isOpen, menuPosition, handleClick, handleClose];
}
