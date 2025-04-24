import type { FileSettings } from '../components/FileManagement/SettingsComponent/AudioSettingsModal';
import { pollTaskStatus } from './pollingHelper';

export async function audioConvertFile(
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
    formData.append('audio_remove_metadata', settings.removeMetadata.toString());
    formData.append('audio_codec', settings.codec);
    formData.append('audio_channels', settings.channels.toString());
    formData.append('audio_sample_rate', settings.sampleRate.toString());
    
    // Format-specific parameters
    const fmt = format.toLowerCase();
    const fmtSettings = settings.formatSpecific[fmt as keyof typeof settings.formatSpecific];
    
    if (fmtSettings) {
      if ('bitrate' in fmtSettings && fmtSettings.bitrate) {
        formData.append('audio_bitrate', fmtSettings.bitrate);
      }
      if ('compressionLevel' in fmtSettings && fmtSettings.compressionLevel != null) {
        formData.append('audio_compression_level', fmtSettings.compressionLevel.toString());
      }
      // ...other settings...
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
