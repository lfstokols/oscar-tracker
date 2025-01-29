import {useState} from 'react';
import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import DefaultCatcher from '../../components/LoadScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import TableControls from '../../features/userStatsTable/TableControls';
import {Hypotheticality} from '../../features/userStatsTable/Enums';

export default function HomeTab(): React.ReactElement {
  const [hypotheticality, setHypotheticality] = useState(Hypotheticality.SEEN);

  return (
    <DefaultCatcher>
      <DefaultTabContainer>
        <TableControls value={hypotheticality} setter={setHypotheticality} />
        <CategoryTable hypotheticality={hypotheticality} />
      </DefaultTabContainer>
      {/* <div style={{display: 'flex', justifyContent: 'center'}}>
        <Countdown />
      </div> */}
    </DefaultCatcher>
  );
}
