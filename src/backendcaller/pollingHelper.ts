export interface TaskStatus {
  status?: string;
  state?: string;
  filename?: string;
  original_name?: string;
  file_id?: string;
  error?: string;
  traceback?: string;
  meta?: {
    progress?: number;
    message?: string;
    filename?: string;
  }
}

interface PollingOptions {
  file: File;
  format: string;
  index: number;
  taskId: string;
  setConversionStatus: (updater: (prev: string[]) => string[]) => void;
  setConversionResults: (updater: (prev: { fileUrl: string, fileName: string }[]) => { fileUrl: string, fileName: string }[]) => void;
  setConversionProgress: (updater: (prev: number[]) => number[]) => void;
  maxRetries?: number;
  pollInterval?: number;
}

export function pollTaskStatus({
  file,
  format,
  index,
  taskId,
  setConversionStatus,
  setConversionResults,
  setConversionProgress,
  maxRetries = 60,
  pollInterval = 1000,
}: PollingOptions): Promise<boolean> {
  let statusCheckInterval: NodeJS.Timeout | null = null;
  let retryCount = 0;

  const BASE_URL = 'https://utility.toridoesthings.xyz/convertifile';
  const STATUS_URL = `${BASE_URL}/status/${taskId}`;
  const RESULT_URL = `${BASE_URL}/result/${taskId}`;

  return new Promise((resolve, reject) => {
    const updateStatus = (msg: string) => {
      setConversionStatus(prev => {
        const updated = [...prev];
        updated[index] = msg;
        return updated;
      });
    };

    const updateProgress = (progress: number) => {
      setConversionProgress(prev => {
        const updated = [...prev];
        updated[index] = progress;
        return updated;
      });
    };

    const setResult = (fileUrl: string, fileName: string) => {
      setConversionResults(prev => {
        const updated = [...prev];
        updated[index] = { fileUrl, fileName };
        return updated;
      });
    };

    const checkFileExists = async () => {
      try {
        const fileCheckResponse = await fetch(RESULT_URL, {
          method: 'HEAD',
          mode: 'cors',
          credentials: 'include'
        });
        if (fileCheckResponse.ok) {
          clearInterval(Number(statusCheckInterval));
          updateStatus('Conversion completed!');
          const fileName = `${file.name.split('.')[0]}.${format}`;
          setResult(RESULT_URL, fileName);
          resolve(true);
          return true;
        }
      } catch (error) {
        console.log("File check failed:", error);
      }
      return false;
    };

    const handleCompleted = (statusData: TaskStatus) => {
      clearInterval(Number(statusCheckInterval));
      if (!statusData.meta?.message) updateStatus('Completed!');
      if (!statusData.meta?.progress) updateProgress(100);
      const fileName = (statusData.filename ?? statusData.original_name) ?? `${file.name.split('.')[0]}.${format}`;
      const fileId = statusData.file_id ?? taskId;
      const fileUrl = `${BASE_URL}/result/${fileId}/`;
      setResult(fileUrl, fileName);
      resolve(true);
    };

    const handleFailed = (statusData: TaskStatus) => {
      clearInterval(Number(statusCheckInterval));
      const errorMsg = statusData.meta?.message ?? statusData.error ?? statusData.traceback ?? 'Unknown error';
      updateStatus(`Failed: ${errorMsg}`);
      resolve(false);
    };

    const handleProcessing = (statusData: TaskStatus, status: string) => {
      if (!statusData.meta?.message) updateStatus(status === 'processing' ? 'Processing...' : 'Started processing...');
      if (!statusData.meta?.progress) updateProgress(status === 'processing' ? 50 : 20);
    };

    const handlePending = (statusData: TaskStatus) => {
      if (!statusData.meta?.message) updateStatus('In queue...');
      if (!statusData.meta?.progress) updateProgress(10);
    };

    const handleUnknown = (statusData: TaskStatus, status: string) => {
      if (!statusData.meta?.message) updateStatus(status ? `Status: ${status}` : 'Unknown status');
    };

    const checkStatus = async () => {
      if (!taskId) {
        clearInterval(Number(statusCheckInterval));
        reject(new Error('Task ID is missing'));
        return;
      }

      retryCount++;
      console.log(`Status check attempt #${retryCount} for file: ${file.name}`);

      if (retryCount > maxRetries) {
        clearInterval(Number(statusCheckInterval));
        updateStatus('Timed out! Retry later.');
        resolve(false);
        return;
      }

      try {
        const statusResponse = await fetch(STATUS_URL, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          },
          redirect: 'follow'  // Explicitly follow redirects
        });

        if (!statusResponse.ok) {
          throw new Error(`Error checking status: ${statusResponse.status}`);
        }

        const statusData: TaskStatus = await statusResponse.json();

        if (retryCount > 5 && !statusData.status && statusData.status !== 'completed') {
          if (await checkFileExists()) return;
        }

        const statusValue = (statusData.status ?? statusData.state) ?? '';
        const status = statusValue.toLowerCase();

        if (statusData.meta) {
          if (statusData.meta.message) updateStatus(statusData.meta.message);
          if (typeof statusData.meta.progress === 'number') updateProgress(statusData.meta.progress);
        }

        switch (status) {
          case 'completed':
            handleCompleted(statusData);
            break;
          case 'failed':
            handleFailed(statusData);
            break;
          case 'processing':
          case 'started':
            handleProcessing(statusData, status);
            break;
          case 'pending':
            handlePending(statusData);
            break;
          default:
            handleUnknown(statusData, status);
            break;
        }
      } catch (error) {
        console.error('Error checking conversion status:', error);
        if (retryCount > 5) {
          if (statusCheckInterval) clearInterval(Number(statusCheckInterval));
          statusCheckInterval = setInterval(() => { void checkStatus(); }, pollInterval * 2);
        }
      }
    };

    statusCheckInterval = setInterval(() => { void checkStatus(); }, pollInterval);
    void checkStatus();
  });
}
