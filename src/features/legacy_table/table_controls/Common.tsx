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
import { useFilterState } from '../../../hooks/useFilterState';
import { useIsMobile } from '../../../hooks/useIsMobile';

export function DisplayedSettingsButton({
  onClick,
  isMobile,
  icon,
  text,
  hasActive,
  reset,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isMobile: boolean;
  icon: React.ReactNode;
  text: string;
  hasActive: boolean;
  reset?: () => void;
}): React.ReactElement {
  const mainButton = (
    isMobile ? (
      <IconButton onClick={onClick}>{icon}</IconButton>
    ) : (
      <Button
        onClick={onClick}
        sx={{display: 'flex', alignItems: 'left', flexDirection: 'row', gap: '8px'}}>
        {icon}
        <Typography>{text}</Typography>
      </Button>
    )
  );
  return (
  <Stack alignItems="center" direction="row" gap="8px">
      {mainButton}
      {hasActive ? <ActiveFilterChip resetFilters={reset ?? (() => {})} /> : null}
  </Stack>
  );
}

function ActiveFilterChip({resetFilters}: {resetFilters: () => void}): React.ReactElement {
  const {filterState} = useFilterState();
  const activeFilters = filterState.watchstatus.length + filterState.categories.length;
  return <Chip label={<Typography>{activeFilters}</Typography>} onDelete={resetFilters} />;
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
