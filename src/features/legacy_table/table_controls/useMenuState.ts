//* Hook to manage menu state
//* Returns:
//* - isOpen: state of menu
//* - handleClick: (event: React.MouseEvent<HTMLElement>) => void

import {useState} from 'react';

//* - handleClose: () => void
export default function useMenuState(): [
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
