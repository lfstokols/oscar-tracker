import {Sync as RefreshIcon} from '@mui/icons-material';
import {Paper, Stack} from '@mui/material';
import {useQueryClient} from '@tanstack/react-query';
import * as React from 'react';
import {NoAccountBlocker} from '../../../components/NoAccountBlocker';
import {API_BASE_URL} from '../../../config/GlobalConstants';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {useIsMobile} from '../../../hooks/useIsMobile';
import {useOscarAppContext} from '../../../providers/AppContext';
import {DisplayedSettingsButton} from '../../legacy_table/table_controls/Common';
import FilterRowsWidget from './FilterRows';
import HideColumnsWidget from './HideColumns';

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
  const handleRefresh = async () => {
    await fetch(`${API_BASE_URL}/hooks/force-refresh`);
    await queryClient.invalidateQueries({
      queryKey: watchlistOptions(year).queryKey,
    });
  };
  const canRefresh = useOscarAppContext().activeUserId !== null;

  return (
    <Paper
      sx={{
        width: '50vw',
        // position: 'sticky',
        // top: '-40px',
      }}>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <NoAccountBlocker hasAccess={canRefresh}>
          <RefreshWidget
            handleRefresh={() => void handleRefresh()}
            isMobile={isMobile}
          />
        </NoAccountBlocker>
        <HideColumnsWidget isMobile={isMobile} />
        <FilterRowsWidget
          filterState={filterState}
          isMobile={isMobile}
          setFilterState={setFilterState}
        />
      </Stack>
    </Paper>
  );
}

function RefreshWidget({
  handleRefresh,
  isMobile,
}: {
  handleRefresh: () => void;
  isMobile: boolean;
}): React.ReactElement {
  return (
    <DisplayedSettingsButton
      icon={<RefreshIcon />}
      isMobile={isMobile}
      onClick={handleRefresh}
      text="Fetch Updates"
    />
  );
}
