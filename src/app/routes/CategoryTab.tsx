import {Suspense} from 'react';
import CategoryTable from '../../features/category_completion_table/CategoryCompletionTable';
import {LoadScreen} from '../../components/LoadScreen';

export default function HomeTab(): React.ReactElement {
  return (
    <Suspense fallback={<LoadScreen />}>
      <CategoryTable />
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {/* <Countdown /> */}
      </div>
    </Suspense>
  );
}
