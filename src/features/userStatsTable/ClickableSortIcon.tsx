import {IconButton} from '@mui/material';
import {ArrowUpward} from '@mui/icons-material';
import {useState} from 'react';

export default function ClickableSortIcon({
  isSelected,
  onSelect,
}: {
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isHidden = !(isSelected || isHovered);
  return (
    <IconButton
      onClick={onSelect}
      onMouseOver={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isSelected}
      //   style={{visibility: isHidden ? 'hidden' : 'visible'}}
    >
      <ArrowUpward color={isSelected || isHovered ? 'primary' : 'disabled'} />
    </IconButton>
  );
}
