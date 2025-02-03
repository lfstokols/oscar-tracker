import {Sync as RefreshIcon} from '@mui/icons-material';
import {CircularProgress} from '@mui/material';
import {useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {NoAccountBlocker} from '../../../components/NoAccountBlocker';
import {API_BASE_URL} from '../../../config/GlobalConstants';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useNotifications} from '../../../providers/NotificationContext';
import {DisplayedSettingsButton} from '../../legacy_table/table_controls/Common';

export default function RefreshWidget({
  isMobile,
}: {
  isMobile: boolean;
}): React.ReactElement {
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const {year, activeUserId} = useOscarAppContext();
  const canRefresh = activeUserId !== null;
  const [isFetching, setIsFetching] = useState(false);

  const handleRefresh = () => {
    setIsFetching(true);

    fetch(`${API_BASE_URL}/hooks/force-refresh`)
      .then(() => {
        setIsFetching(false);
        notifications.show({
          type: 'success',
          message: `Your watchlist is up to date with recently entered Letterboxd data.`,
        });
      })
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: watchlistOptions(year).queryKey,
        });
      })
      .catch(() => {
        setIsFetching(false);
        notifications.show({
          type: 'error',
          message: 'Failed to update watchlist',
        });
      });
  };

  return (
    <NoAccountBlocker hasAccess={canRefresh}>
      <DisplayedSettingsButton
        hasActive={false}
        icon={<Icon isFetching={isFetching} />}
        isMobile={isMobile}
        onClick={handleRefresh}
        reset={() => {}}
        text="Fetch Updates"
      />
    </NoAccountBlocker>
  );
}

function Icon({isFetching}: {isFetching: boolean}): React.ReactElement {
  return (
    <div style={{position: 'relative', width: '24px', height: '24px'}}>
      {isFetching ? (
        <CircularProgress
          color="info"
          size={24}
          sx={{position: 'absolute', top: 0, left: 0}}
          thickness={8}
        />
      ) : (
        <RefreshIcon sx={{position: 'absolute', top: 0, left: 0}} />
      )}
    </div>
  );
}
