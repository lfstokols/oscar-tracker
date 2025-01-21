import {Suspense} from 'react';
import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import DefaultCatcher, {LoadScreen} from '../../components/LoadScreen';

export default function HomeTab(): React.ReactElement {
  return (
    <DefaultCatcher>
      <CategoryTable />
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {/* <Countdown /> */}
      </div>
    </DefaultCatcher>
  );
}
