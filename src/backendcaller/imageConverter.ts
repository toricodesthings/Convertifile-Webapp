import type { FileSettings } from '../components/FileManagement/SettingsComponent/ImageSettingsModal';
import { pollTaskStatus } from './pollingHelper';

export async function convertFile(
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
    
    // Append parameters in the exact order expected by the backend
    formData.append('remove_metadata', settings.removeMetadata.toString());
    formData.append('compression', settings.compression.toString());
    
    // Only append quality if compression is enabled
    if (settings.compression) {
      formData.append('quality', settings.quality.toString());
    }
    
    // Format-specific optimization parameter using switch case
    switch (format.toLowerCase()) {
      case 'jpg':
        formData.append('optimize', settings.formatSpecific.jpg.optimize.toString());
        break;
      case 'webp':
        formData.append('optimize', settings.formatSpecific.webp.optimize.toString());
        break;
      case 'png':
        formData.append('optimize', settings.formatSpecific.png.optimize.toString());
        break;
      case 'bmp':
        formData.append('bmp_compression', settings.formatSpecific.bmp.compression.toString());
        break;
      case 'tga':
        formData.append('tga_compression', settings.formatSpecific.tga.compression.toString());
        break;
      case 'avif':
        formData.append('avif_speed', settings.formatSpecific.avif.speed.toString());
        break;
      case 'pdf':
        formData.append('page_size', settings.formatSpecific.pdf.page_size);
        break;
      default:
        formData.append('optimize', 'false');
        formData.append('bmp_compression', 'true');
        formData.append('tga_compression', 'true');
        formData.append('avif_speed', '6');
        formData.append('page_size', 'A4');
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
