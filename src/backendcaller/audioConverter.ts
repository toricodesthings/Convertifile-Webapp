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
    formData.append('remove_metadata', settings.removeMetadata.toString());
    if (settings.channels !== undefined) {
      formData.append('channels', settings.channels.toString());
    }
    if (settings.sampleRate !== undefined && settings.sampleRate !== null) {
      formData.append('sample_rate', settings.sampleRate.toString());
    }
  
    // Format-specific parameters
    const fmt = format.toLowerCase();
    const fmtSettings = settings.formatSpecific[fmt as keyof typeof settings.formatSpecific];
  
    if (fmtSettings) {
      if ('bitrate' in fmtSettings && fmtSettings.bitrate) {
        formData.append('bitrate', fmtSettings.bitrate);
      }
      if ('compressionLevel' in fmtSettings && fmtSettings.compressionLevel != null) {
        formData.append('compression_level', fmtSettings.compressionLevel.toString());
      }
      if ('lossless' in fmtSettings && fmtSettings.lossless !== undefined) {
        formData.append('lossless', fmtSettings.lossless ? 'true' : 'false');
      }
      if ('sampleRate' in fmtSettings && fmtSettings.sampleRate !== undefined && fmtSettings.sampleRate !== null) {
        // Ensure sampleRate is a primitive value before stringifying
        const sampleRateValue = typeof fmtSettings.sampleRate === 'object'
          ? (fmtSettings.sampleRate ?? '') // Adjust this if your object structure differs
          : fmtSettings.sampleRate;
        if (sampleRateValue !== '') {
          formData.append('sample_rate', sampleRateValue.toString());
        }
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
