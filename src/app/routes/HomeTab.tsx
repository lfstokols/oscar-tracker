import {Suspense, useEffect, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {useSearchParams} from 'react-router-dom';
import AppErrorScreen from '../../components/AppErrorScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import {LoadScreen} from '../../components/LoadScreen';
import LegacyTable from '../../features/legacy_table/LegacyTable';
import TableControls from '../../features/legacy_table/table_controls/TableControls';
import {useOscarAppContext} from '../../providers/AppContext';
import { CategoryIdSchema } from '../../types/APIDataSchema';
import {WatchStatus} from '../../types/Enums';
import { isKeyInObject } from '../../utils/objectUtils';

export default function HomeTab(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const defaultFilterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  } = {
    watchstatus: [],
    categories: [],
  };
  if (isKeyInObject('category', searchParams)) {
    const writtenCategories = searchParams.get('category')?.split(',') ?? [];
    defaultFilterState.categories = writtenCategories.map((category) =>
      CategoryIdSchema.parse(category)
    );
  }
  if (isKeyInObject('watchstatus', searchParams)) {
    const writtenWatchStatuses = searchParams.get('watchstatus')?.split(',') ?? [];
    defaultFilterState.watchstatus = writtenWatchStatuses.filter(writtenWatchStatus => 
      isKeyInObject(writtenWatchStatus, WatchStatus)
    ).map(writtenWatchStatus => WatchStatus[writtenWatchStatus]);
  }

  const [filterState, setFilterState] = useState(defaultFilterState);

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
