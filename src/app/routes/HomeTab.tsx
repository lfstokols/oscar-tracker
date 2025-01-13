import {Suspense} from 'react';
import LegacyTable from '../../features/LegacyTable';
import {LoadScreen} from '../../components/LoadScreen';

export default function HomeTab(): React.ReactElement {
  return (
    <Suspense fallback={<LoadScreen />}>
      <LegacyTable />
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {/* <Countdown /> */}
      </div>
    </Suspense>
  );
}
