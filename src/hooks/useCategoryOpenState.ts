import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Grouping } from "../types/Enums";
import { objectFromEntries, objectValues } from "../utils/objectUtils";

type OpenState = Record<Grouping, boolean>;

const VALUE = '1';

export function useCategoryOpenState(): [OpenState, (newOpenStateOrUpdater: OpenState | ((prev: OpenState) => OpenState)) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const openState: OpenState = objectFromEntries(
      objectValues(Grouping).map(grouping => [grouping, false]),
  );
  for (const grouping of objectValues(Grouping)) {
    if (searchParams.get(grouping) !== null) {
      openState[grouping] = true;
    }
  }
  
  const setOpenState = useCallback((newOpenStateOrUpdater: OpenState | ((prev: OpenState) => OpenState)) => {
    const newOpenState = (typeof newOpenStateOrUpdater === 'function') 
      ? newOpenStateOrUpdater(openState)
      : newOpenStateOrUpdater;

    const newSearchParams = new URLSearchParams();
    for (const grouping of objectValues(Grouping)) {
      if (newOpenState[grouping]) {
        newSearchParams.append(grouping, VALUE);
      }
    }
    setSearchParams(newSearchParams);
  }, [setSearchParams, openState]);

  return [openState, setOpenState];
}
