import React, {memo, useCallback} from 'react';
// import { useNotifications } from './NotificationContext';
import Snackbar, {SnackbarCloseReason} from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export type Notification = {
  key: string;
  message: string;
  autoHideDurationMs: number | null;
  type: NotificationType;
};

export type NotificationType = 'error' | 'info' | 'success' | 'warning';

type Props = {
  activeNotification: Notification | null;
  setActiveNotification: (notif: Notification | null) => void;
};

export default memo(function NotificationToast({
  activeNotification,
  setActiveNotification,
}: Props): React.ReactElement {
  const handleClose = useCallback(
    (_event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
      // Don't auto-close if user clicks on screen
      if (reason === 'clickaway') {
        return;
      }
      setActiveNotification(null);
    },
    [setActiveNotification],
  );

  return (
    <Snackbar
      key={activeNotification?.key}
      autoHideDuration={activeNotification?.autoHideDurationMs}
      onClose={handleClose}
      open={activeNotification != null}>
      <Alert
        onClose={handleClose}
        severity={activeNotification?.type}
        sx={{width: '100%'}}
        variant="filled">
        {activeNotification?.message}
      </Alert>
    </Snackbar>
  );
});
