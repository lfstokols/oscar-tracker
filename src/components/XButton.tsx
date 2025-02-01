import CloseIcon from '@mui/icons-material/Close';
import {IconButton} from '@mui/material';

export default function XButton({onClick}: {onClick: () => void}): React.ReactElement {
  return (
    <IconButton onClick={onClick} sx={{position: 'absolute', top: 0, right: 0}}>
      <CloseIcon />
    </IconButton>
  );
}
