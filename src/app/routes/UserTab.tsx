import {Suspense} from 'react';
import UserStatsTable from '../../features/userStatsTable/UserStatsTable';
import {LoadScreen} from '../../components/LoadScreen';

export default function UserTab(): React.ReactElement {
  return (
    <Suspense fallback={<LoadScreen />}>
      <UserStatsTable />
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {/* <Countdown /> */}
      </div>
    </Suspense>
  );
}
