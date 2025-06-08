import { FileSettings } from '../components/FileManagement/SettingsComponent/GifSettingsModal';
import { pollTaskStatus } from './pollingHelper';

/**
 * Converts a video file to GIF format using backend API
 * 
 * @param file - The video file to convert
 * @param format - The target format (gif)
 * @param index - The index of the file in a batch (always 0 for GIF converter)
 * @param settings - GIF-specific conversion settings
 * @param setConversionStatus - Function to update conversion status message
 * @param setConversionResults - Function to set the conversion results
 * @param setConversionProgress - Function to update conversion progress
 * @returns Promise resolving to success (true) or failure (false)
 */
export async function gifConvertFile(
  file: File,
  format: string,
  index: number,
  settings: FileSettings,
  setConversionStatus: (updater: (prev: string[]) => string[]) => void,
  setConversionResults: (updater: (prev: { fileUrl: string, fileName: string }[]) => { fileUrl: string, fileName: string }[]) => void,
  setConversionProgress: (updater: (prev: number[]) => number[]) => void
): Promise<boolean> {

  let taskId: string | null = null;

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
    formData.append('video_remove_metadata', settings.removeMetadata.toString());
    
    // Always set codec to gif for GIF conversion
    formData.append('video_codec', 'gif');
    
    // Add GIF-specific settings
    formData.append('video_fps', settings.fps.toString());
    formData.append('gif_quality', settings.quality.toString());
    
    // Optional dimension settings
    if (settings.width) {
      formData.append('gif_width', settings.width.toString());
    }
    
    if (settings.height) {
      formData.append('gif_height', settings.height.toString());
    }
    
    formData.append('gif_maintain_aspect_ratio', settings.maintainAspectRatio.toString());
    formData.append('gif_loop', settings.loop.toString());
    formData.append('gif_dither', settings.dither.toString());

    setConversionStatus(prev => {
      const updated = [...prev];
      updated[index] = 'Sending to server';
      return updated;
    });

    // For debugging only
    console.log('GIF Conversion FormData contents:');
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

    // Submit conversion task
    const response = await fetch('https://utility.toridoesthings.xyz/convertifile/convert', {
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

    // Use polling helper
    return pollTaskStatus({
      file,
      format,
      index,
      taskId,
      setConversionStatus,
      setConversionResults,
      setConversionProgress,
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
