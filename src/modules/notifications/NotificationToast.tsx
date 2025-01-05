
import React, { memo, use, useState, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export type Notification = {
  key: string,
  message: string,
  autoHideDurationMs: number | null,
  type: NotificationType,
};

export type NotificationType = 'error' | 'info' | 'success' | 'warning';

type Props = {
  activeNotification: Notification | null,
  setActiveNotification: (notif: Notification | null) => void
};

export default memo(function NotificationToast(
  {activeNotification, setActiveNotification}: Props,
): React.ReactElement {

  const handleClose = useCallback((
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    // Don't auto-close if user clicks on screen
    if (reason === 'clickaway') {
      return;
    }
    setActiveNotification(null);
  }, [setActiveNotification]);

  return (
    <Snackbar
      autoHideDuration={activeNotification?.autoHideDurationMs}
      key={activeNotification?.key}
      onClose={handleClose}
      open={activeNotification != null}>
      <Alert
        onClose={handleClose}
        severity={activeNotification?.type}
        variant="filled"
        sx={{ width: '100%' }}>
        {activeNotification?.message}
      </Alert>
    </Snackbar>
  );
});
