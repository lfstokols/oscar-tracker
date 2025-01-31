import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {Hypotheticality} from '../features/userStatsTable/Enums';

export default function HypotheticalityToggleGroup({
  value,
  setter,
}: {
  value: Hypotheticality;
  setter: (value: Hypotheticality) => void;
}) {
  return (
    <ToggleButtonGroup
      color="primary"
      exclusive
      onChange={(_, newValue: Hypotheticality) => setter(newValue)}
      size="small"
      value={value}>
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
