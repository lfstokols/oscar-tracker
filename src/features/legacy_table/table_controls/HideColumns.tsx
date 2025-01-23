import React, {useState} from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  Button,
  Typography,
  Paper,
  Checkbox,
} from '@mui/material';
import {
  Category as ColumnsIcon,
  FilterAlt as RowsIcon,
} from '@mui/icons-material';
import {useOscarAppContext} from '../../../providers/AppContext';
import {columnList} from '../LegacyTable';
import {DisplayedSettingsButton, useMenuState, CenteredMenu} from './Common';

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
      <DisplayedButton onClick={handleClick} isMobile={isMobile} />
      {isOpen && (
        <PlaceholderMenu
          menuPosition={menuPosition}
          isOpen={isOpen}
          onClose={handleClose}
          hiddenColumns={hiddenColumns}
        />
      )}
    </Paper>
  );
}

function PlaceholderMenu({
  menuPosition,
  isOpen,
  onClose,
  hiddenColumns,
}: {
  menuPosition: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  hiddenColumns: string[];
}): React.ReactElement {
  return (
    <CenteredMenu menuPosition={menuPosition} isOpen={isOpen} onClose={onClose}>
      <Typography variant="h6" color="textDisabled" sx={{p: 2}}>
        This feature is coming soon!
      </Typography>
    </CenteredMenu>
  );
}

function SelectionMenu({
  isOpen,
  onClose,
  hiddenColumns,
}: {
  isOpen: boolean;
  onClose: () => void;
  hiddenColumns: string[];
}): React.ReactElement {
  return (
    <Menu open={isOpen} onClose={onClose}>
      {columnList.map(column => (
        <MenuItem key={column}>
          <Checkbox
            checked={hiddenColumns.includes(column)}
            onChange={() => {}}
          />
        </MenuItem>
      ))}
    </Menu>
  );
}

function DisplayedButton({
  onClick,
  isMobile,
}: {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  isMobile: boolean;
}): React.ReactElement {
  return (
    <DisplayedSettingsButton
      onClick={onClick}
      isMobile={isMobile}
      icon={<ColumnsIcon />}
      text="Hide Columns"
    />
  );
}
