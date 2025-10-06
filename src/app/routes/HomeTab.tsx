import {Suspense, useEffect} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import AppErrorScreen from '../../components/AppErrorScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import {LoadScreen} from '../../components/LoadScreen';
import LegacyTable from '../../features/legacy_table/LegacyTable';
import TableControls from '../../features/legacy_table/table_controls/TableControls';
import {useFilterState} from '../../hooks/useFilterState';
import {useOscarAppContext} from '../../providers/AppContext';

export default function HomeTab(): React.ReactElement {
  const {filterState, setFilterState} = useFilterState();

  const {activeUserId} = useOscarAppContext();

  // Reset filterState when activeUserId changes
  useEffect(() => {
    if (activeUserId == null) {
      setFilterState(prev => ({
        ...prev,
        watchstatus: [],
      }));
    }
  }, [activeUserId, setFilterState]);

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
