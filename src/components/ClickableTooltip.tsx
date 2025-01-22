import {useState} from 'react';
import {Box, Tooltip, ClickAwayListener} from '@mui/material';

export function ClickableTooltip({
  children,
  popup,
  arrow = false,
  followCursor = false,
}: {
  children: React.ReactNode;
  popup: React.ReactNode;
  arrow?: boolean;
  followCursor?: boolean;
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
          },
        }}
        title={popup}
        followCursor={followCursor}>
        {/* <span> */}
        {/* <Box onClick={handleTooltipOpen}>{children}</Box> */}
        {children}
        {/* </span> */}
      </Tooltip>
    </ClickAwayListener>
  );
}
