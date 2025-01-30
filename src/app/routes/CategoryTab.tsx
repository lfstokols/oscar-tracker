import {useState} from 'react';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import DefaultCatcher from '../../components/LoadScreen';
import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import {Hypotheticality} from '../../features/userStatsTable/Enums';
import TableControls from '../../features/userStatsTable/TableControls';

export default function HomeTab(): React.ReactElement {
  const [hypotheticality, setHypotheticality] = useState(Hypotheticality.SEEN);

  return (
    <DefaultCatcher>
      <DefaultTabContainer>
        <TableControls setter={setHypotheticality} value={hypotheticality} />
        <CategoryTable hypotheticality={hypotheticality} />
      </DefaultTabContainer>
      {/* <div style={{display: 'flex', justifyContent: 'center'}}>
        <Countdown />
      </div> */}
    </DefaultCatcher>
  );
}
