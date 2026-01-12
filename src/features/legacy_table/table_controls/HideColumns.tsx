import {
  Category as ColumnsIcon,
  // FilterAlt as RowsIcon,
} from '@mui/icons-material';
import {
  Paper,
  // Menu,
  // MenuItem,
  // IconButton,
  // Button,
  Typography,
  // Checkbox,
} from '@mui/material';
import * as React from 'react';
import {useOscarAppContext} from '../../../providers/AppContext';
// import {columnList} from '../LegacyTable';
import {CenteredMenu, DisplayedSettingsButton} from './Common';
import useMenuState from './useMenuState';

export default function HideColumnsWidget({
  isMobile,
}: {
  isMobile: boolean;
}): React.ReactElement {
  const {preferences} = useOscarAppContext();
  const hiddenColumns = preferences.hiddenColumns.legacy;
  const [isOpen, menuPosition, handleClick, handleClose] = useMenuState();
  const hasActive = hiddenColumns.length > 0;

  return (
    <Paper>
      <DisplayedButton
        hasActive={hasActive}
        isMobile={isMobile}
        onClick={handleClick}
      />
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
  hasActive,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isMobile: boolean;
  hasActive: boolean;
}): React.ReactElement {
  return (
    <DisplayedSettingsButton
      hasActive={hasActive}
      icon={<ColumnsIcon />}
      isMobile={isMobile}
      onClick={onClick}
      text="Hide Columns"
    />
  );
}
