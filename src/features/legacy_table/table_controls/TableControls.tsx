import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {Button, Stack, IconButton} from '@mui/material';
import {Refresh as RefreshIcon} from '@mui/icons-material';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useIsMobile} from '../../../hooks/useIsMobile';
import HideColumnsWidget from './HideColumns';
import FilterRowsWidget from './FilterRows';

export const TableControls = ({
  filterState,
  setFilterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  setFilterState: (filterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  }) => void;
}) => {
  const queryClient = useQueryClient();
  const {year} = useOscarAppContext();
  const isMobile = useIsMobile();
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: watchlistOptions(year).queryKey,
    });
  };

  return (
    <Stack direction="row" width="80%" justifyContent="space-between">
      <IconButton onClick={handleRefresh}>
        <RefreshIcon />
      </IconButton>
      <HideColumnsWidget isMobile={isMobile} />
      <FilterRowsWidget
        isMobile={isMobile}
        filterState={filterState}
        setFilterState={setFilterState}
      />
    </Stack>
  );
};
