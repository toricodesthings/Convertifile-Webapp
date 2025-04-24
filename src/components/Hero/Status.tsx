'use client';

import { useState, useEffect } from 'react';

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
        const response = await fetch('https://utility.toridoesthings.xyz/convertifile/health', {
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

    void checkServerStatus();
    
    // Set up interval to check periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      void checkServerStatus();
    }, 30000);
    
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