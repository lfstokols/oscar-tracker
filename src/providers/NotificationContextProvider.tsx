import {useMemo, useState} from 'react';
import NotificationContext from './NotificationContext';
import NotificationToast, {Notification} from '../components/NotificationToast';

type Props = {
  children: React.ReactNode;
};

export default function NotificationContextProvider({
  children,
}: Props): React.ReactElement {
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
      {children}
      <NotificationToast
        activeNotification={activeNotification}
        setActiveNotification={setActiveNotification}
      />
    </NotificationContext.Provider>
  );
}
