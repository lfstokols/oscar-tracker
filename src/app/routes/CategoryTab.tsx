import {useState} from 'react';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import DefaultCatcher from '../../components/LoadScreen';
import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import TableControls from '../../features/category_completion_table/TableControls';
import {Hypotheticality} from '../../features/userStatsTable/Enums';
import {useCategoryOpenState} from '../../hooks/useCategoryOpenState';

export default function CategoryTab(): React.ReactElement {
  const [hypotheticality, setHypotheticality] = useState(Hypotheticality.SEEN);

  const [areOpen, setAreOpen] = useCategoryOpenState();

  return (
    <DefaultCatcher>
      <DefaultTabContainer>
        <TableControls
          openGroups={areOpen}
          setOpenGroups={setAreOpen}
          setter={setHypotheticality}
          value={hypotheticality}
        />
        <CategoryTable
          areOpen={areOpen}
          hypotheticality={hypotheticality}
          setAreOpen={setAreOpen}
        />
      </DefaultTabContainer>
      {/* <div style={{display: 'flex', justifyContent: 'center'}}>
        <Countdown />
      </div> */}
    </DefaultCatcher>
  );
}
