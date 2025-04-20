'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './notification.module.css';

export interface Notification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success';
}

interface NotificationContainerProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  removeNotification
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted
    ? createPortal(
        <div className={styles.notificationsContainer}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`${styles.notification} ${styles[notification.type] || ''}`}
            >
              <span>{notification.message}</span>
              <button
                className={styles.notificationClose}
                onClick={() => removeNotification(notification.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>,
        document.body
      )
    : null;
};

export default NotificationContainer;
