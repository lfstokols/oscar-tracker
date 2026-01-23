import {useCallback, useMemo} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {HOME_URL} from '../config/GlobalConstants';
import {useOscarAppContext} from '../providers/AppContext';
import {CategoryIdSchema} from '../types/APIDataSchema';
import {WatchStatus} from '../types/Enums';
import {isKeyInObject} from '../utils/objectUtils';

type FilterState = {
  watchstatus: WatchStatus[];
  categories: CategoryId[];
};

const SEPARATOR = '-';

export function useFilterState(): {
  filterState: FilterState;
  setFilterState: (
    newFilterState: FilterState | ((prev: FilterState) => FilterState),
  ) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterState: FilterState = useMemo(() => {
    const result: FilterState = {
      watchstatus: [],
      categories: [],
    };
    if (searchParams.get('category') !== null) {
      const writtenCategories =
        searchParams.get('category')?.split(SEPARATOR) ?? [];
      result.categories = writtenCategories.map(category =>
        CategoryIdSchema.parse(category),
      );
    }
    if (searchParams.get('watchstatus') !== null) {
      const writtenWatchStatuses =
        searchParams.get('watchstatus')?.split(SEPARATOR) ?? [];
      result.watchstatus = writtenWatchStatuses
        .filter(writtenWatchStatus =>
          isKeyInObject(writtenWatchStatus, WatchStatus),
        )
        .map(writtenWatchStatus => WatchStatus[writtenWatchStatus]);
    }
    return result;
  }, [searchParams]);

  const setFilterState = useCallback(
    (
      newFilterStateOrUpdater:
        | FilterState
        | ((prev: FilterState) => FilterState),
    ) => {
      const newFilterState =
        typeof newFilterStateOrUpdater === 'function'
          ? newFilterStateOrUpdater(filterState)
          : newFilterStateOrUpdater;
      const newSearchParams = createParamsFromFilterState(newFilterState);
      setSearchParams(newSearchParams);
    },
    [filterState, setSearchParams],
  );

  return {filterState, setFilterState};
}

export function useNavigateToFilterState(): (filterState: FilterState) => void {
  const navigate = useNavigate();
  const {year} = useOscarAppContext();
  return useCallback(
    (filterState: FilterState) => {
      const newSearchParams = createParamsFromFilterState(filterState);
      void navigate(`/${HOME_URL}/${year}/?${newSearchParams.toString()}`);
    },
    [navigate, year],
  );
}

function createParamsFromFilterState(
  filterState: FilterState,
): URLSearchParams {
  const newSearchParams = new URLSearchParams();
  if (filterState.categories.length > 0) {
    const stringOfCategories = filterState.categories.join(SEPARATOR);
    newSearchParams.set('category', stringOfCategories);
  }
  if (filterState.watchstatus.length > 0) {
    const stringOfWatchStatuses = filterState.watchstatus.join(SEPARATOR);
    newSearchParams.set('watchstatus', stringOfWatchStatuses);
  }
  return newSearchParams;
}
