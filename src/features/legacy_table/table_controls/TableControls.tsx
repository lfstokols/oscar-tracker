import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {Button, Paper, Stack, IconButton} from '@mui/material';
import {Refresh as RefreshIcon} from '@mui/icons-material';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useIsMobile} from '../../../hooks/useIsMobile';
import HideColumnsWidget from './HideColumns';
import FilterRowsWidget from './FilterRows';
import {NoAccountBlocker} from '../../../components/NoAccountBlocker';

export default function TableControls({
  filterState,
  setFilterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  setFilterState: (filterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  }) => void;
}): React.ReactElement {
  const queryClient = useQueryClient();
  const {year} = useOscarAppContext();
  const isMobile = useIsMobile();
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: watchlistOptions(year).queryKey,
    });
  };
  const canRefresh = useOscarAppContext().activeUserId !== null;
  const handleForceRefresh = () => {
    fetch(`/force-refresh`);
  };

  return (
    <Paper sx={{width: '50vw', position: 'sticky', top: '-40px'}}>
      <Stack direction="row" width="100%" justifyContent="space-between">
        <NoAccountBlocker hasAccess={canRefresh}>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </NoAccountBlocker>
        <HideColumnsWidget isMobile={isMobile} />
        <FilterRowsWidget
          isMobile={isMobile}
          filterState={filterState}
          setFilterState={setFilterState}
        />
      </Stack>
    </Paper>
  );
}
