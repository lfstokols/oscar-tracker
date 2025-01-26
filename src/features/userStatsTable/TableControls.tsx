import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import {Hypotheticality} from './Enums';
import {ColumnLabels} from './Enums';

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
      onChange={(_, newValue) => setter(newValue)}
      exclusive
      color="primary"
      size="small">
      <ToggleButton value={Hypotheticality.SEEN}>
        <TaskAltIcon />
        Completed
      </ToggleButton>
      <ToggleButton value={Hypotheticality.BOTH}>
        <FollowTheSignsIcon />
        Planned
      </ToggleButton>
      <ToggleButton value={Hypotheticality.TODO}>
        <HourglassTopIcon />
        Remaining
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
