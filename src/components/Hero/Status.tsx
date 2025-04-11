'use client';

import { useState, useEffect } from 'react';

export type ServerStatusType = {
  status: string;
  isOnline: boolean;
};


// Accept styles as a prop to use the same styling from the Hero component
const ServerStatus = ({ styles }: { styles: Record<string, string> }) => {
  const [status, setStatus] = useState<ServerStatusType>({
    status: 'Connecting...',
    isOnline: false
  });

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            status: data.status,
            isOnline: true
          });
        } else {
          setStatus({
            status: 'Error',
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

    // Check immediately when component mounts
    checkServerStatus();
    
    // Set up interval to check periodically (every 30 seconds)
    const intervalId = setInterval(checkServerStatus, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <span className={`${styles["status-dot"]} ${styles[status.isOnline ? "online" : "offline"]}`}></span>
      Server Status: {status.status}
    </>
  );
};

export default ServerStatus;