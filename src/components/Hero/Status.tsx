'use client';

import { useState, useEffect } from 'react';

const HEALTH_CHECK_URL = 'https://utility.toridoesthings.xyz/convertifile/health';

export interface ServerStatusType {
  status: string;
  isOnline: boolean;
}

const ServerStatus = ({ styles }: { styles: Record<string, string> }) => {
  const [status, setStatus] = useState<ServerStatusType>({
    status: 'Connecting...',
    isOnline: false
  });

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(HEALTH_CHECK_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'include',
        });
        
        if (response.ok) {
          setStatus({
            status: 'Online',
            isOnline: true
          });
        } else {
          setStatus({
            status: 'Server Error',
            isOnline: false
          });
        }
      } catch (error) {
        console.error('Error checking server status:', error);
        setStatus({
          status: 'Offline',
          isOnline: false
        });
      }
    };
    
    // Set up interval to check periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      checkServerStatus().catch(console.error);
    }, 30000);

    void checkServerStatus();

    return () => { clearInterval(intervalId); };
  }, []);

  return (
    <>
      <span className={`${styles["status-dot"]} ${styles[status.isOnline ? "online" : "offline"]}`}></span>
      Server Status: {status.status}
    </>
  );
};

export default ServerStatus;