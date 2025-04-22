import type { FileSettings } from '../components/FileManagement/SettingsComponent/VideoSettingsModal';
import { pollTaskStatus } from './pollingHelper';

export async function videoConvertFile(
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
  if (settings.codec) {
    formData.append('video_codec', settings.codec);
  }
  if (settings.fps !== undefined && settings.fps !== null) {
    formData.append('video_fps', settings.fps.toString());
  }

  // Format-specific parameters
  const fmt = format.toLowerCase();
  const fmtSettings = settings.formatSpecific[fmt as keyof typeof settings.formatSpecific];

  if (fmtSettings) {
    if ('profile' in fmtSettings && fmtSettings.profile) {
      formData.append('video_profile', fmtSettings.profile);
    }
    if ('level' in fmtSettings && fmtSettings.level) {
      formData.append('video_level', fmtSettings.level.toString());
    }
    if ('crf' in fmtSettings && fmtSettings.crf !== undefined && fmtSettings.crf !== null) {
      formData.append('video_crf', fmtSettings.crf.toString());
    }
    if ('speed' in fmtSettings && fmtSettings.speed) {
      formData.append('video_speed', fmtSettings.speed);
    }
    if ('bitrate' in fmtSettings && fmtSettings.bitrate) {
      // Convert numeric bitrate (in kbps) to format like "2M", "3M", etc.
      const bitrateInMbps = fmtSettings.bitrate + 'M';
      formData.append('video_bitrate', bitrateInMbps);
    }
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

    // Submit conversion task
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
