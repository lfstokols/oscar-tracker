import {useState} from 'react';
import Countdown from '../../components/Countdown';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import HypotheticalityToggleGroup from '../../components/HypotheticalityToggleGroup';
import DefaultCatcher from '../../components/LoadScreen';
import {Hypotheticality} from '../../features/userStatsTable/Enums';
import UserStatsTable from '../../features/userStatsTable/UserStatsTable';

export default function UserTab(): React.ReactElement {
  const [hypotheticality, setHypotheticality] = useState(Hypotheticality.SEEN);

  return (
    <DefaultCatcher>
      <DefaultTabContainer>
        <HypotheticalityToggleGroup
          setter={setHypotheticality}
          value={hypotheticality}
        />
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
