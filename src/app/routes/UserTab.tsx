import {Suspense} from 'react';
import UserStatsTable from '../../features/userStatsTable/UserStatsTable';
import DefaultCatcher, {LoadScreen} from '../../components/LoadScreen';

export default function UserTab(): React.ReactElement {
  return (
    <DefaultCatcher>
      <UserStatsTable />
      <div style={{display: 'flex', justifyContent: 'center'}}>
        {/* <Countdown /> */}
      </div>
    </DefaultCatcher>
  );
}
