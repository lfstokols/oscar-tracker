import {useState} from 'react';
import {Box, Tooltip, ClickAwayListener} from '@mui/material';

export function ClickableTooltip({
  children,
  popup,
  arrow = false,
  followCursor = false,
  isOpaque = false,
}: {
  children: React.ReactNode;
  popup: React.ReactNode;
  arrow?: boolean;
  followCursor?: boolean;
  isOpaque?: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const handleTooltipOpen = () => {
    setOpen(true);
  };
  const handleTooltipClose = () => {
    setOpen(false);
  };
  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <Tooltip
        open={open}
        onClose={handleTooltipClose}
        onOpen={handleTooltipOpen}
        disableFocusListener
        arrow={arrow}
        slotProps={{
          popper: {
            disablePortal: true,
            sx: {
              maxWidth: '800px !important',
              '& .MuiTooltip-tooltip': {
                maxWidth: '800px',
                padding: '16px',
                ...(isOpaque && {background: '#616161'}),
              },
            },
          },
        }}
        title={popup}
        followCursor={followCursor}>
        <span style={{width: 'fit-content', display: 'inline-block'}}>
          <Box onClick={handleTooltipOpen} sx={{width: 'fit-content'}}>
            {children}
          </Box>
        </span>
      </Tooltip>
    </ClickAwayListener>
  );
}
