import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import {Hypotheticality} from './Enums';

export default function TableControls({
  value,
  setter,
}: {
  value: Hypotheticality;
  setter: (value: Hypotheticality) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      onChange={(_, newValue: Hypotheticality) => setter(newValue)}
      exclusive
      color="primary"
      size="small">
      <ToggleButton value={Hypotheticality.SEEN}>
        <TaskAltIcon sx={{mr: 1}} />
        Completed
      </ToggleButton>
      <ToggleButton value={Hypotheticality.BOTH}>
        <FollowTheSignsIcon sx={{mr: 1}} />
        Planned
      </ToggleButton>
      <ToggleButton value={Hypotheticality.TODO}>
        <HourglassTopIcon sx={{mr: 1}} />
        Remaining
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
