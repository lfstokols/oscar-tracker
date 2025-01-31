import {useState} from 'react';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import DefaultCatcher from '../../components/LoadScreen';
import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import TableControls from '../../features/category_completion_table/TableControls';
import {Hypotheticality} from '../../features/userStatsTable/Enums';
import {Grouping} from '../../types/Enums';
import {objectFromEntries, objectValues} from '../../utils/objectUtils';

export default function CategoryTab(): React.ReactElement {
  const [hypotheticality, setHypotheticality] = useState(Hypotheticality.SEEN);

  const [areOpen, setAreOpen] = useState<Record<Grouping, boolean>>(
    objectFromEntries(
      objectValues(Grouping).map(grouping => [grouping, false]),
    ),
  );

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
