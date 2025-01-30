import React from 'react';
import {
  // Menu,
  // MenuItem,
  // IconButton,
  // Button,
  Typography,
  Paper,
  // Checkbox,
} from '@mui/material';
import {
  Category as ColumnsIcon,
  // FilterAlt as RowsIcon,
} from '@mui/icons-material';
import {useOscarAppContext} from '../../../providers/AppContext';
// import {columnList} from '../LegacyTable';
import {DisplayedSettingsButton, CenteredMenu} from './Common';
import useMenuState from './useMenuState';

export default function HideColumnsWidget({
  isMobile,
}: {
  isMobile: boolean;
}): React.ReactElement {
  const {preferences} = useOscarAppContext();
  const hiddenColumns = preferences.hiddenColumns.legacy;
  const [isOpen, menuPosition, handleClick, handleClose] = useMenuState();

  return (
    <Paper>
      <DisplayedButton isMobile={isMobile} onClick={handleClick} />
      {!!isOpen && (
        <PlaceholderMenu
          hiddenColumns={hiddenColumns}
          isOpen={isOpen}
          menuPosition={menuPosition}
          onClose={handleClose}
        />
      )}
    </Paper>
  );
}

function PlaceholderMenu({
  menuPosition,
  isOpen,
  onClose,
  hiddenColumns: _hiddenColumns,
}: {
  menuPosition: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  hiddenColumns: string[];
}): React.ReactElement {
  return (
    <CenteredMenu isOpen={isOpen} menuPosition={menuPosition} onClose={onClose}>
      <Typography color="textDisabled" sx={{p: 2}} variant="h6">
        This feature is coming soon!
      </Typography>
    </CenteredMenu>
  );
}

// function SelectionMenu({
//   isOpen,
//   onClose,
//   hiddenColumns,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   hiddenColumns: string[];
// }): React.ReactElement {
//   return (
//     <Menu open={isOpen} onClose={onClose}>
//       {columnList.map(column => (
//         <MenuItem key={column}>
//           <Checkbox
//             checked={hiddenColumns.includes(column)}
//             onChange={() => {}}
//           />
//         </MenuItem>
//       ))}
//     </Menu>
//   );
// }

function DisplayedButton({
  onClick,
  isMobile,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isMobile: boolean;
}): React.ReactElement {
  return (
    <DisplayedSettingsButton
      icon={<ColumnsIcon />}
      isMobile={isMobile}
      onClick={onClick}
      text="Hide Columns"
    />
  );
}
