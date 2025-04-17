interface ConversionSettings {
  removeMetadata: boolean;
  compression: boolean;
  quality: number;
  formatSpecific: {
    jpg: {
      optimize: boolean;
    }
    webp: {
      optimize: boolean;
    };
    bmp: {
      compression: boolean;
    };
    tga: {
      compression: boolean;
    }
    png: {
      optimize: boolean;
    };
    avif: {
      speed: number; 
    };
  };
}

interface TaskStatus {
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

export async function convertFile(
  file: File,
  format: string,
  index: number,
  settings: ConversionSettings,
  setConversionStatus: (updater: (prev: string[]) => string[]) => void,
  setConversionResults: (updater: (prev: { fileUrl: string, fileName: string }[]) => { fileUrl: string, fileName: string }[]) => void,
  setConversionProgress: (updater: (prev: number[]) => number[]) => void
): Promise<boolean> {

  let taskId: string | null = null;
  let statusCheckInterval: NodeJS.Timeout | null = null;
  let retryCount = 0;
  const MAX_RETRIES = 20;
  const POLL_INTERVAL = 500;

  try {
    // Update status to starting
    setConversionStatus(prev => {
      const updated = [...prev];
      updated[index] = 'Starting conversion';
      return updated;
    });

    // Prepare form data with file and settings
    const formData = new FormData();
    formData.append('file', file);
    formData.append('convert_to', format);
    
    // Append parameters in the exact order expected by the backend
    formData.append('remove_metadata', settings.removeMetadata.toString());
    formData.append('compression', settings.compression.toString());
    
    // Only append quality if compression is enabled
    if (settings.compression) {
      formData.append('quality', settings.quality.toString());
    }
    
    // Format-specific optimization parameter using switch case
    let optimize = false;
    switch (format.toLowerCase()) {
      case 'jpg':
        optimize = settings.formatSpecific.jpg.optimize;
        break;
      case 'webp':
        optimize = settings.formatSpecific.webp.optimize;
        break;
      case 'png':
        optimize = settings.formatSpecific.png.optimize;
        break;
    }
    formData.append('optimize', optimize.toString());
    
    // BMP compression parameter
    switch (format.toLowerCase()) {
      case 'bmp':
        formData.append('bmp_compression', settings.formatSpecific.bmp.compression.toString());
        break;
      default:
        formData.append('bmp_compression', 'true'); // default value
        break;
    }
    
    // TGA compression parameter
    switch (format.toLowerCase()) {
      case 'tga':
        formData.append('tga_compression', settings.formatSpecific.tga.compression.toString());
        break;
      default:
        formData.append('tga_compression', 'true'); // default value
        break;
    }
    
    formData.append('pdf_page_size', 'A4');
    
    // AVIF speed parameter
    switch (format.toLowerCase()) {
      case 'avif':
        formData.append('avif_speed', settings.formatSpecific.avif.speed.toString());
        break;
      default:
        formData.append('avif_speed', '6'); // default value
        break;
    }

    setConversionStatus(prev => {
      const updated = [...prev];
      updated[index] = 'Sending to server';
      return updated;
    });

    // For debugging only
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (key === 'file') {
        console.log(`${key}: `, value instanceof File ? {
          name: value.name,
          type: value.type,
          size: `${(value.size / 1024).toFixed(2)} KB`
        } : value);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    // Submit conversion task with CORS headers
    const response = await fetch('http://localhost:8000/convertifileapp/convert', {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    taskId = data.celery_id;

    if (!taskId) {
      throw new Error('No task ID returned from server');
    }

    // Start polling for task status
    return new Promise((resolve, reject) => {
      // Utility functions for updating state
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

      // Helper to handle fallback file check
      const checkFileExists = async () => {
        try {
          const fileCheckResponse = await fetch(
            `http://localhost:8000/convertifileapp/result/${taskId}`,
            { method: 'HEAD', mode: 'cors', credentials: 'include' }
          );
          if (fileCheckResponse.ok) {
            clearInterval(Number(statusCheckInterval));
            updateStatus('Conversion completed!');
            const fileName = `${file.name.split('.')[0]}.${format}`;
            const fileUrl = `http://localhost:8000/convertifileapp/result/${taskId}`;
            setResult(fileUrl, fileName);
            resolve(true);
            return true;
          }
        } catch (error) {
          console.log("File check failed:", error);
        }
        return false;
      };

      // Status handlers
      const handleCompleted = (statusData: TaskStatus) => {
        clearInterval(Number(statusCheckInterval));
        if (!statusData.meta?.message) updateStatus('Completed!');
        if (!statusData.meta?.progress) updateProgress(100);
        const fileName = (statusData.filename ?? statusData.original_name) || `${file.name.split('.')[0]}.${format}`;
        const fileId = statusData.file_id ?? taskId!;
        const fileUrl = `http://localhost:8000/convertifileapp/result/${fileId}`;
        setResult(fileUrl, fileName);
        resolve(true);
      };

      const handleFailed = (statusData: TaskStatus) => {
        clearInterval(Number(statusCheckInterval));
        const errorMsg = statusData.meta?.message || statusData.error || statusData.traceback || 'Unknown error';
        if (!statusData.meta?.message) updateStatus(`Failed: ${errorMsg}`);
        resolve(false);
      };

      const handleProcessing = (statusData: TaskStatus, status: string) => {
        if (!statusData.meta?.message) updateStatus(status === 'processing' ? 'Processing...' : 'Started processing...');
        if (!statusData.meta?.progress) updateProgress(status === 'processing' ? 50 : 25);
      };

      const handlePending = (statusData: TaskStatus) => {
        if (!statusData.meta?.message) updateStatus('In queue...');
        if (!statusData.meta?.progress) updateProgress(10);
      };

      const handleUnknown = (statusData: TaskStatus, status: string) => {
        if (!statusData.meta?.message) updateStatus(status ? `Status: ${status}` : 'Unknown status');
      };

      // Define the polling function
      const checkStatus = async () => {
        if (!taskId) {
          clearInterval(Number(statusCheckInterval));
          reject(new Error('Task ID is missing'));
          return;
        }

        retryCount++;
        console.log(`Status check attempt #${retryCount} for file: ${file.name}`);

        // Stop checking after max retries
        if (retryCount > MAX_RETRIES) {
          clearInterval(Number(statusCheckInterval));
          updateStatus('Timed out! Retry later.');
          resolve(false);
          return;
        }

        try {
          const statusResponse = await fetch(`http://localhost:8000/convertifileapp/status/${taskId}`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (!statusResponse.ok) {
            throw new Error(`Error checking status: ${statusResponse.status}`);
          }

          const statusData: TaskStatus = await statusResponse.json();
          console.log(`Status data for ${file.name}:`, statusData);

          // Fallback: check file exists if status is missing after several retries
          if (retryCount > 6 && !statusData.status && statusData.status !== 'completed') {
            if (await checkFileExists()) return;
          }

          // Extract status string
          const statusValue = (statusData.status ?? statusData.state) || '';
          const status = typeof statusValue === 'string' ? statusValue.toLowerCase() : '';

          // Always update meta message/progress if present
          if (statusData.meta) {
            if (statusData.meta.message) updateStatus(statusData.meta.message);
            if (typeof statusData.meta.progress === 'number') updateProgress(statusData.meta.progress);
          }

          // Handle status
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
            clearInterval(Number(statusCheckInterval));
            statusCheckInterval = setInterval(checkStatus, POLL_INTERVAL * 2);
          }
        }
      };

      // Start the polling interval
      statusCheckInterval = setInterval(checkStatus, POLL_INTERVAL);

      // Run the first check immediately
      checkStatus();
    });

  } catch (error) {
    console.error('Conversion error:', error);
    setConversionStatus(prev => {
      const updated = [...prev];
      updated[index] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return updated;
    });
    return false;
  }
}
