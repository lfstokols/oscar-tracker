import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryIdSchema } from "../types/APIDataSchema";
import { WatchStatus } from "../types/Enums";
import { isKeyInObject } from "../utils/objectUtils";

type FilterState = {
  watchstatus: WatchStatus[];
  categories: CategoryId[];
}

const SEPARATOR = '-';

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  } = {
    watchstatus: [],
    categories: [],
  };
  if (searchParams.get('category') !== null) {
    const writtenCategories = searchParams.get('category')?.split(SEPARATOR) ?? [];
    filterState.categories = writtenCategories.map((category) =>
      CategoryIdSchema.parse(category)
    );
  }
  if (searchParams.get('watchstatus') !== null) {
    const writtenWatchStatuses = searchParams.get('watchstatus')?.split(SEPARATOR) ?? [];
    filterState.watchstatus = writtenWatchStatuses.filter(writtenWatchStatus => 
      isKeyInObject(writtenWatchStatus, WatchStatus)
    ).map(writtenWatchStatus => WatchStatus[writtenWatchStatus]);
  }
  
  const setFilterState = useCallback((newFilterState: FilterState) => {
    const newSearchParams = new URLSearchParams();
    if (newFilterState.categories.length > 0) {
      const stringOfCategories = newFilterState.categories.join(SEPARATOR);
      newSearchParams.set('category', stringOfCategories);
    }
    if (newFilterState.watchstatus.length > 0) {
      const stringOfWatchStatuses = newFilterState.watchstatus.join(SEPARATOR);
      newSearchParams.set('watchstatus', stringOfWatchStatuses);
    }
    setSearchParams(newSearchParams);
  }, [setSearchParams]);

  return {filterState, setFilterState};
}
