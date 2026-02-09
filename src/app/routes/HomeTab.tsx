import {Suspense, useEffect} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import AppErrorScreen from '../../components/AppErrorScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import {LoadScreen} from '../../components/LoadScreen';
import TableControls from '../../features/both_movie_views/table_controls/TableControls';
import MovieList from '../../features/movie_info/MovieList';
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
            type="cards"
          />
          <MovieList filterState={filterState} />
        </DefaultTabContainer>
      </Suspense>
    </ErrorBoundary>
  );
}
