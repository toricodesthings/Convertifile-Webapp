interface ConversionSettings {
  removeMetadata: boolean;
  compression: boolean;
  quality: number;
  formatSpecific: {
    webp: {
      optimize: boolean;
    };
    bmp: {
      compression: boolean;
    };
    png: {
      optimize: boolean;
    };
    tiff: {
      compression: "none" | "lzw" | "jpeg";
    };
    avif: {
      speed: number; // 0-10 value
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
    formData.append('remove_metadata', settings.removeMetadata.toString());

    // Add compression settings if enabled
    if (settings.compression) {
      formData.append('compression', 'true');
      formData.append('quality', settings.quality.toString());
    }
    switch (format.toLowerCase()) {
      case 'webp':
        formData.append('optimize', settings.formatSpecific.webp.optimize.toString());
        break;
      
      case 'bmp':
        formData.append('bmp_compression', settings.formatSpecific.bmp.compression.toString());
        break;
      
      case 'png':
        formData.append('optimize', settings.formatSpecific.png.optimize.toString());
        break;
      
      case 'avif':
        formData.append('avif_speed', settings.formatSpecific.avif.speed.toString());
        break;
      
      case 'tiff':
        formData.append('tiff_compression', settings.formatSpecific.tiff.compression);
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
        // Don't set Content-Type when using FormData as it will 
        // automatically include the correct multipart/form-data with boundary
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
          setConversionStatus(prev => {
            const updated = [...prev];
            updated[index] = 'Timed out! Retry later.';
            return updated;
          });
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

          // Check if the file exists directly as a fallback
          if (retryCount > 6 && !statusData.status && statusData.status !== 'completed') {
            try {
              // Make a HEAD request to see if the file exists
              const fileCheckResponse = await fetch(
                `http://localhost:8000/convertifileapp/result/${taskId}`,
                { method: 'HEAD', mode: 'cors', credentials: 'include' }
              );

              if (fileCheckResponse.ok) {
                // File exists but status wasn't updated correctly
                clearInterval(Number(statusCheckInterval));
                setConversionStatus(prev => {
                  const updated = [...prev];
                  updated[index] = 'Conversion completed!';
                  return updated;
                });

                // Generate download info
                const fileName = `${file.name.split('.')[0]}.${format}`;
                const fileUrl = `http://localhost:8000/convertifileapp/result/${taskId}`;

                setConversionResults(prev => {
                  const updated = [...prev];
                  updated[index] = { fileUrl, fileName };
                  return updated;
                });

                resolve(true);
                return;
              }
            } catch (error) {
              console.log("File check failed:", error);
            }
          }

          // Get the actual status string (different backends might use different fields)
          const statusValue = statusData.status || statusData.state || '';

          const status = typeof statusValue === 'string' ? statusValue.toLowerCase() : '';

          // Extract meta information first - this applies to ALL status types
          if (statusData.meta) {
            // Always update with any message from meta when available
            if (statusData.meta.message) {
              setConversionStatus(prev => {
                const updated = [...prev];
                updated[index] = statusData.meta!.message!;
                return updated;
              });
            }

            // Always update progress when available
            if (typeof statusData.meta.progress === 'number') {
              setConversionProgress(prev => {
                const updated = [...prev];
                updated[index] = statusData.meta!.progress!;
                return updated;
              });
            }
          }

          // Then handle the specific status cases
          if (status === 'completed') {
            // Conversion completed successfully
            clearInterval(Number(statusCheckInterval));

            // Only set default message if meta.message wasn't available
            if (!statusData.meta?.message) {
              setConversionStatus(prev => {
                const updated = [...prev];
                updated[index] = 'Completed!';
                return updated;
              });
            }

            // Set progress to 100% if not already set
            if (!statusData.meta?.progress) {
              setConversionProgress(prev => {
                const updated = [...prev];
                updated[index] = 100;
                return updated;
              });
            }

            // Generate download info
            const fileName = statusData.filename || statusData.original_name || `${file.name.split('.')[0]}.${format}`;
            const fileId = statusData.file_id || taskId;
            const fileUrl = `http://localhost:8000/convertifileapp/result/${fileId}`;

            // Add download information to results
            setConversionResults(prev => {
              const updated = [...prev];
              updated[index] = { fileUrl, fileName };
              return updated;
            });

            resolve(true);
          } else if (status === 'failed') {
            // Conversion failed
            clearInterval(Number(statusCheckInterval));

            // Get error message from meta if available, otherwise use default error sources
            const errorMsg = statusData.meta?.message || statusData.error || statusData.traceback || 'Unknown error';

            // Only set if we didn't already set from meta.message
            if (!statusData.meta?.message) {
              setConversionStatus(prev => {
                const updated = [...prev];
                updated[index] = `Failed: ${errorMsg}`;
                return updated;
              });
            }

            resolve(false);
          } else if (status === 'processing') {
            // Processing or Started - both indicate active processing
            // We already handled meta.message and meta.progress earlier
            if (!statusData.meta?.message) {
              setConversionStatus(prev => {
                const updated = [...prev];
                updated[index] = status === 'processing' ? 'Processing...' : 'Started processing...';
                return updated;
              });
            }

            // Set a default progress if not already set
            if (!statusData.meta?.progress) {
              setConversionProgress(prev => {
                const updated = [...prev];
                updated[index] = status === 'processing' ? 50 : 25; // Higher for processing than started
                return updated;
              });
            }
          } else if (status === 'pending') {
            // Task is waiting in queue
            if (!statusData.meta?.message) {
              setConversionStatus(prev => {
                const updated = [...prev];
                updated[index] = 'In queue...';
                return updated;
              });
            }

            if (!statusData.meta?.progress) {
              setConversionProgress(prev => {
                const updated = [...prev];
                updated[index] = 10;
                return updated;
              });
            }
          } else {
            // Unknown status
            if (!statusData.meta?.message) {
              setConversionStatus(prev => {
                const updated = [...prev];
                updated[index] = status ? `Status: ${status}` : 'Unknown status';
                return updated;
              });
            }

            // No default progress for unknown status
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
