import {Suspense, useEffect, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import AppErrorScreen from '../../components/AppErrorScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import {LoadScreen} from '../../components/LoadScreen';
import LegacyTable from '../../features/legacy_table/LegacyTable';
import TableControls from '../../features/legacy_table/table_controls/TableControls';
import {useOscarAppContext} from '../../providers/AppContext';

export default function HomeTab(): React.ReactElement {
  const [filterState, setFilterState] = useState({
    watchstatus: [] as WatchStatus[],
    categories: [] as CategoryId[],
  });

  const {activeUserId} = useOscarAppContext();

  // Reset filterState when activeUserId changes
  useEffect(() => {
    setFilterState({
      watchstatus: [],
      categories: [],
    });
  }, [activeUserId]);

  return (
    <ErrorBoundary fallback={<AppErrorScreen isFullScreen={false} />}>
      <Suspense fallback={<LoadScreen />}>
        <DefaultTabContainer>
          <TableControls
            filterState={filterState}
            setFilterState={setFilterState}
          />
          <LegacyTable filterState={filterState} />
        </DefaultTabContainer>
      </Suspense>
    </ErrorBoundary>
  );
}
