import {Button, IconButton, Typography, Menu} from '@mui/material';

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
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      onClose={onClose}
      open={isOpen}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}>
      {children}
    </Menu>
  );
}
