import {ArrowUpward} from '@mui/icons-material';
import {IconButton} from '@mui/material';
import {useState} from 'react';

export default function ClickableSortIcon({
  isSelected,
  onSelect,
}: {
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  // const isHidden = !(isSelected || isHovered);
  return (
    <IconButton
      disabled={isSelected}
      onClick={onSelect}
      onMouseLeave={() => setIsHovered(false)}
      onMouseOver={() => setIsHovered(true)}
      //   style={{visibility: isHidden ? 'hidden' : 'visible'}}
    >
      <ArrowUpward color={isSelected || isHovered ? 'primary' : 'disabled'} />
    </IconButton>
  );
}
