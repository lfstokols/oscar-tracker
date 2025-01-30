import {useState} from 'react';
import UserStatsTable from '../../features/userStatsTable/UserStatsTable';
import DefaultCatcher from '../../components/LoadScreen';
import Countdown from '../../components/Countdown';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import TableControls from '../../features/userStatsTable/TableControls';
import {Hypotheticality} from '../../features/userStatsTable/Enums';

export default function UserTab(): React.ReactElement {
  const [hypotheticality, setHypotheticality] = useState(Hypotheticality.SEEN);

  return (
    <DefaultCatcher>
      <DefaultTabContainer>
        <TableControls setter={setHypotheticality} value={hypotheticality} />
        <UserStatsTable hypotheticality={hypotheticality} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 0.3,
            justifyContent: 'center',
          }}>
          <Countdown />
        </div>
      </DefaultTabContainer>
    </DefaultCatcher>
  );
}
