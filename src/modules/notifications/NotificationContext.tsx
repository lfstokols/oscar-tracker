import React, {use, useState, useMemo, useCallback, useContext} from 'react';
import NotificationToast, {
  Notification,
  NotificationType,
} from './NotificationToast';

const DEFAULT_HIDE_DURATION_MS = 6000; // 6 seconds

export type NotificationContextValue = Readonly<{
  setActiveNotification: (notif: Notification | null) => void;
}>;

// NotificationContext should not be exported
const NotificationContext: React.Context<NotificationContextValue> =
  React.createContext({
    setActiveNotification: notif => {},
  });

type Props = {
  children: React.ReactElement;
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

interface NotificationsDispatch {
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
// ! Is p0 needed?
export function useNotifications(p0: any): NotificationsDispatch {
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
    [],
  );

  return {show};
}
