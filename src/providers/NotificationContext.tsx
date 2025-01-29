import React, {useState, useMemo, useCallback, useContext} from 'react';
import NotificationToast, {
  Notification,
  NotificationType,
} from '../components/NotificationToast';
import {DEFAULT_HIDE_DURATION_MS} from '../config/GlobalConstants';

export type NotificationContextValue = Readonly<{
  setActiveNotification: (notif: Notification | null) => void;
}>;

// NotificationContext should not be exported
const NotificationContext: React.Context<NotificationContextValue> =
  React.createContext({
    setActiveNotification: _notif => {},
  });

type Props = {
  children: React.ReactNode;
};

export default function NotificationContextProvider(
  props: Props,
): React.ReactElement {
  const [activeNotification, setActiveNotification] =
    useState<Notification | null>(null);

  const contextValue = useMemo(
    () => ({
      setActiveNotification,
    }),
    [],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {props.children}
      <NotificationToast
        activeNotification={activeNotification}
        setActiveNotification={setActiveNotification}
      />
    </NotificationContext.Provider>
  );
}

interface NotificationDispatchArgs {
  type: NotificationType;
  message: string;
  autoHideDurationMs?: number;
}

export interface NotificationsDispatch {
  show: (args: NotificationDispatchArgs) => void;
}

/**
 * Use this hook from anywhere under the NotificationContextProvider to trigger a toast.
 *
 * Example usage:
 * const notifications = useNotifications();
 *
 * const onMutationError = () => notifications.show({type: 'error', message: 'An error occurred'});
 */
export function useNotifications(): NotificationsDispatch {
  // TODO - Consider upgrading to React v19 to get fancy use() hook
  //const { setActiveNotification } = use(NotificationContext);
  const {setActiveNotification} = useContext(NotificationContext);

  const show = useCallback(
    ({
      type,
      message,
      autoHideDurationMs = DEFAULT_HIDE_DURATION_MS,
    }: NotificationDispatchArgs) =>
      setActiveNotification({
        type,
        message,
        autoHideDurationMs:
          autoHideDurationMs === 0 ? null : autoHideDurationMs,
        key: String(new Date().getTime()),
      }),
    [setActiveNotification],
  );

  return {show};
}
