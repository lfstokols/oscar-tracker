import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Menu,
  Stack,
  Typography,
} from '@mui/material';
import XButton from '../../../components/XButton';
import {useIsMobile} from '../../../hooks/useIsMobile';

export function DisplayedSettingsButton({
  onClick,
  isMobile,
  icon,
  text,
  whatIsActive,
  reset,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isMobile: boolean;
  icon: React.ReactNode;
  text: string;
  whatIsActive?: string;
  reset?: () => void;
}): React.ReactElement {
  const mainButton = isMobile ? (
    <IconButton onClick={onClick}>{icon}</IconButton>
  ) : (
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
  return (
    <Stack alignItems="center" direction="row" gap="8px">
      {mainButton}
      {whatIsActive === undefined ? null : (
        <ActiveFilterChip
          resetFilters={reset ?? (() => {})}
          whatIsActive={whatIsActive}
        />
      )}
    </Stack>
  );
}

function ActiveFilterChip({
  resetFilters,
  whatIsActive,
}: {
  resetFilters: () => void;
  whatIsActive: string;
}): React.ReactElement {
  return (
    <Chip
      label={<Typography>{whatIsActive}</Typography>}
      onDelete={resetFilters}
    />
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

export function MobileMenu({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Dialog PaperProps={{sx: {marginX: 0}}} onClose={onClose} open={isOpen}>
      <DialogContent sx={{borderRadius: '12px'}}>
        <XButton onClick={onClose} />
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function FlexibleMenu({
  isOpen,
  onClose,
  children,
  menuPosition,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  menuPosition: HTMLElement | null;
}): React.ReactElement {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileMenu isOpen={isOpen} onClose={onClose}>
        {children}
      </MobileMenu>
    );
  }
  return (
    <CenteredMenu isOpen={isOpen} menuPosition={menuPosition} onClose={onClose}>
      {children}
    </CenteredMenu>
  );
}
