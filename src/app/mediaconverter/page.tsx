'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from "./mediaconverter.module.css";
import fileItemStyles from "../../components/FileManagement/fileItem.module.css";
import uploadButtonStyles from "../../components/FileManagement/uploadButton.module.css";
import { audioConvertFile } from '../../backendcaller/audioConverter';
import { videoConvertFile } from '../../backendcaller/videoConverter';
import FileUploader from '../../components/FileManagement/FileUploader';
import FileInstruction from '../../components/FileManagement/FileInstruction';
import NotificationContainer, { Notification } from '../../components/FileManagement/NotificationContainer';
import AudioSettingsModal, { FileSettings as AudioFileSettings } from '../../components/FileManagement/SettingsComponent/AudioSettingsModal';
import VideoSettingsModal, { FileSettings as VideoFileSettings } from '../../components/FileManagement/SettingsComponent/VideoSettingsModal';

// Define type
type FileSettings = AudioFileSettings | VideoFileSettings;

/**
 * Media Rules
 */
const AVAILABLE_FORMATS = [["mp4", "webm", "mkv", "mov", "avi", "wmv", "flv", "ts", "mts"], ["mp3", "ogg", "opus", "aac", "m4a", "flac", "alac", "wav", "aiff", "wma", "amr", "ac3"]];
const MAX_FILE_SIZE_MB = [1024, 512]; // 1GB for video, 512MB for audio
const MAX_FILE_SIZE_BYTES = [MAX_FILE_SIZE_MB[0] * 1024 * 1024, MAX_FILE_SIZE_MB[1] * 1024 * 1024]; // Convert MB to bytes
const MAX_FILES_COUNT = 3;

// Default settings for audio and video
const audioDefaultSettings: AudioFileSettings = {
  removeMetadata: false,
  channels: 2,
  sampleRate: 44100,
  codec: 'libmp3lame',
  formatSpecific: {
    mp3: { bitrate: '192k', compressionLevel: 6 },
    ogg: { bitrate: '192k', compressionLevel: 10 },
    opus: { bitrate: '192k', compressionLevel: 10 },
    aac: { bitrate: '192k' },
    m4a: { bitrate: '192k' },
    flac: { compressionLevel: 5 },
    wma: { bitrate: '192k' },
    amr: { bitrate: '192k' },
    ac3: { bitrate: '192k' },
  }
}

const videoDefaultSettings: VideoFileSettings = {
  removeMetadata: false,
  codec: 'libx264',
  fps: null,
  formatSpecific: {
    mp4: { profile: 'main', level: 4.0, crf: 23, speed: 'medium', bitrate: 8 },
    webm: { speed: 'good', bitrate: 6 },
    mkv: { profile: 'main', level: 4.0, crf: 23, speed: 'medium', bitrate: 8 },
    mov: { profile: 'main', level: 4.0, crf: 23, speed: 'medium', bitrate: 8 },
    ts: { profile: 'main', level: 4.0, crf: 23, speed: 'medium', bitrate: 8 },
    mts: { profile: 'main', level: 4.0, crf: 23, speed: 'medium', bitrate: 8 },
  }
}

/**
 * ImageConverterPage component - Main page for converting images between formats
 * This component handles file selection, format conversion settings, and processing
 * 
 * @returns React component
 */
const MediaConverterPage = () => {
  // File management state
  const [files, setFiles] = useState<File[]>([]);
  // Helper to get media type: "audio", "video", or ""
  const getMediaType = (file: File): string => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return '';
  };
  const mediaType = files.length > 0 ? getMediaType(files[0]) : '';

  // Pick defaultSettings based on mediaType
  const defaultSettings = useMemo<FileSettings>(() => {
    if (mediaType === 'audio') return audioDefaultSettings;
    if (mediaType === 'video') return videoDefaultSettings;
    return audioDefaultSettings;
  }, [mediaType]); 

  const [filesAdded, setFilesAdded] = useState(false);
  const [deletingFileIndex, setDeletingFileIndex] =useState<number | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // UI references and drag-drop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [buttonsVisible, setButtonsVisible] = useState(true);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string[]>([]);
  const [conversionProgress, setConversionProgress] = useState<number[]>([]);
  const [conversionResults, setConversionResults] = useState<{ fileUrl: string, fileName: string }[]>([]);
  const [allConversionsComplete, setAllConversionsComplete] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const [fileSettings, setFileSettings] = useState<FileSettings[]>([]);
  const [tempSettings, setTempSettings] = useState<FileSettings>({ ...audioDefaultSettings });

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Function to add a notification
  const addNotification = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 3000);
  };

  // Function to remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  useEffect(() => {
    if (files.length > 0) {
      setFilesAdded(true);
    }
  }, [files]);

  // Initialize settings for new files
  useEffect(() => {
    if (mediaType === 'audio') {
      setFileSettings(files.map(() => ({ ...audioDefaultSettings })));
      setTempSettings({ ...audioDefaultSettings });
    } else if (mediaType === 'video') {
      setFileSettings(files.map(() => ({ ...videoDefaultSettings })));
      setTempSettings({ ...videoDefaultSettings });
    }
  }, [files, defaultSettings, mediaType]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isConverting) {
      timeoutId = setTimeout(() => {
        setButtonsVisible(false);
      }, 200);

    } else {
      setButtonsVisible(true);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isConverting]);

  useEffect(() => {
    if (showDropdown !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        // Cast the event target to Element to check if it's a node that matches our selectors
        const target = event.target as Element;

        // Check if the click was outside both the dropdown and the toggle button
        const isOutsideDropdown = !target.closest(`.${fileItemStyles.formatDropdown}`);
        const isOutsideToggle = !target.closest(`.${fileItemStyles.dropdownToggle}`);

        if (isOutsideDropdown && isOutsideToggle) {
          setShowDropdown(null);
        }
      };

      // Add the event listener
      document.addEventListener('mousedown', handleClickOutside);

      // Remove the event listener when cleanup
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      validateAndAddFiles(acceptedFiles);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: {
      'video/*': [],
      'audio/*': []
    },
    noClick: true,
    multiple: true,
    maxSize: Math.max(...MAX_FILE_SIZE_BYTES)
  });

  const getAvailableFormats = (file: File): string[] => {
    const mediaType = getMediaType(file);
    if (mediaType === 'video') {
      // Allow self-conversion: do not filter out the current format
      return AVAILABLE_FORMATS[0];
    } else if (mediaType === 'audio') {
      // Allow self-conversion: do not filter out the current format
      return AVAILABLE_FORMATS[1];
    }
    return [];
  };

  // Restrictions application
  const isFileSizeValid = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE_BYTES[0];
  };

  // Refactored: Validate and add files (used by both select and drop)
  const validateAndAddFiles = (incomingFiles: File[]) => {
    // Check if adding the files would exceed the maximum count
    if (files.length + incomingFiles.length > MAX_FILES_COUNT) {
      addNotification(`You can only add up to ${MAX_FILES_COUNT} files at a time. You already have ${files.length} files.`);
      return;
    }

    // Only allow audio or video files, reject others
    const validMediaFiles = incomingFiles.filter(f => getMediaType(f) === 'audio' || getMediaType(f) === 'video');
    const rejectedNonMedia = incomingFiles.length - validMediaFiles.length;
    if (rejectedNonMedia > 0) {
      addNotification(`${rejectedNonMedia} file(s) were rejected because they are not audio or video files.`, 'warning');
    }
    if (validMediaFiles.length === 0) return;

    // Determine current media type in state (if any)
    const currentType = files.length > 0 ? getMediaType(files[0]) : '';
    // Determine type of incoming files (if any)
    const incomingTypes = validMediaFiles.map(getMediaType).filter(Boolean);
    const uniqueIncomingTypes = Array.from(new Set(incomingTypes));

    // If files already exist, only allow adding files of the same type
    if (currentType && uniqueIncomingTypes.length > 0 && uniqueIncomingTypes.some(type => type !== currentType)) {
      addNotification(`Cannot mix audio and video files. Please only add ${currentType} files.`, 'warning');
      return;
    }

    // If incoming mixed types, only accept one type
    const acceptedType = currentType || uniqueIncomingTypes[0] || '';
    const mediaFiles = validMediaFiles.filter(f => getMediaType(f) === acceptedType);

    // Reject files of other type
    const rejectedForType = validMediaFiles.length - mediaFiles.length;

    // Filter out files exceeding size limit
    const validSizeFiles = mediaFiles.filter(isFileSizeValid);
    const rejectedForSize = mediaFiles.length - validSizeFiles.length;

    if (rejectedForType > 0) {
      addNotification(`${rejectedForType} file(s) were rejected because they are not ${acceptedType} files.`, 'warning');
    }
    if (rejectedForSize > 0) {
      // Show the correct max file size for the acceptedType
      const sizeLimit =
        acceptedType === 'video'
          ? MAX_FILE_SIZE_MB[0]
          : acceptedType === 'audio'
          ? MAX_FILE_SIZE_MB[1]
          : Math.max(...MAX_FILE_SIZE_MB);
      addNotification(
        `${rejectedForSize} file(s) were rejected because they exceed the ${sizeLimit}MB size limit.`,
        'warning'
      );
    }

    if (validSizeFiles.length > 0) {
      const newFiles = [...files, ...validSizeFiles];
      setFiles(newFiles);
      setSelectedFormats(prev => [
        ...prev,
        ...validSizeFiles.map(file => getAvailableFormats(file)[0])
      ]);
      setFileSettings(prev => [
        ...prev,
        ...validSizeFiles.map(() => ({ ...defaultSettings }))
      ]);
      setFilesAdded(true);
    }
  };

  // Handle file selection from Button input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);
        validateAndAddFiles(selectedFiles);
      }
    }, 0);
  };

  // Handle button click to open file input dialog
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle clearing files
  const handleClearFiles = () => {
    setFiles([]);
    setFilesAdded(false);
    setSelectedFormats([]);
    setConversionStatus([]);
    setFileSettings([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle format change for a specific file
  const handleFormatChange = (index: number, format: string) => {

    const updatedFormats = [...selectedFormats];
    updatedFormats[index] = format;
    setSelectedFormats(updatedFormats);
    setShowDropdown(null);
  };

  // Handle deleting a specific file
  const handleDeleteFile = (indexToDelete: number) => {
    // Mark the file as being deleted to trigger the animation
    setDeletingFileIndex(indexToDelete);

    // Wait for animation to complete before removing from state
    setTimeout(() => {
      setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToDelete));
      setSelectedFormats(prev => prev.filter((_, index) => index !== indexToDelete));
      setConversionStatus(prev => prev.filter((_, index) => index !== indexToDelete));
      setFileSettings(prev => prev.filter((_, index) => index !== indexToDelete));
      setDeletingFileIndex(null);
      if (files.length === 1) {
        setFilesAdded(false);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 300);
  };

  // Handle opening settings modal for a specific file
  const handleOpenSettings = (index: number) => {
    setCurrentFileIndex(index);
    setTempSettings({ ...fileSettings[index] });
    setShowSettings(true);
  };

  // Handle applying settings from the modal
  const handleApplySettings = () => {
    setFileSettings(prev => {
      const updated = [...prev];
      updated[currentFileIndex] = { ...tempSettings };
      return updated;
    });
    setShowSettings(false);
  };


  const handleApplyAll = () => {
    const currentFormat = selectedFormats[currentFileIndex]; // Changed from editingFileIndex
    const currentSettings = tempSettings; // Use tempSettings directly instead of fileSettings[editingFileIndex]
    
    // Apply these settings to all files with matching format
    const updatedSettings = [...fileSettings];
    selectedFormats.forEach((format, index) => {
      if (format === currentFormat) {
        updatedSettings[index] = {...currentSettings};
      }
    });
    
    setFileSettings(updatedSettings);
    setShowSettings(false);
  };

  const handleConvert = async () => {
    if (allConversionsComplete) {
      // Reset everything
      setFiles([]);
      setFilesAdded(false);
      setSelectedFormats([]);
      setConversionStatus([]);
      setConversionProgress([]);
      setConversionResults([]);
      setFileSettings([]);
      setIsConverting(false);
      setAllConversionsComplete(false);
      return;
    }

    setIsConverting(true);
    setAllConversionsComplete(false);
    setConversionStatus(Array(files.length).fill('In queue...'));
    setConversionResults(Array(files.length).fill({ fileUrl: '', fileName: '' }));
    setConversionProgress(Array(files.length).fill(0));

    // Process files sequentially to avoid resource contention
    for (let i = 0; i < files.length; i++) {
      try {
        if (mediaType === 'audio') {
          await audioConvertFile(
            files[i],
            selectedFormats[i],
            i,
            fileSettings[i] as AudioFileSettings,
            setConversionStatus,
            setConversionResults,
            setConversionProgress
          );
        } else if (mediaType === 'video') {
          await videoConvertFile(
            files[i],
            selectedFormats[i],
            i,
            fileSettings[i] as VideoFileSettings,
            setConversionStatus,
            setConversionResults,
            setConversionProgress
          );
        }

        // Add a small delay between files
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Error converting file ${i}:`, error);
        setConversionStatus(prev => {
          const updated = [...prev];
          updated[i] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          return updated;
        });
      }
    }

    // Check if all conversions are complete after all files have been processed
    setAllConversionsComplete(true);
  };

  // Handle downloading converted files
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // All media files have settings
  const hasSettings = () => true;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Media Converter</h1>

      <section
        {...getRootProps({
          className:
            `${styles.uploadSection} ${filesAdded ? styles.solid : styles.dashed} ${isDragActive ? styles.dragging : ''} ${showSettings ? styles.blurredContent : ''}`
        })}
      >
        {isDragActive && (
          <div className={styles.dropOverlay}>
            <p>Drop Files Here</p>
          </div>
        )}

        {/* Use dropzone's getInputProps for drag-and-drop, keep hidden input for manual click */}
        <input {...getInputProps()} style={{ display: 'none' }} />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="video/*,audio/*"
          style={{ display: 'none' }}
        />

        {files.length > 0 ? (
          <FileInstruction
            files={files}
            deletingFileIndex={deletingFileIndex}
            selectedFormats={selectedFormats}
            getAvailableFormats={getAvailableFormats}
            showDropdown={showDropdown}
            onFormatChange={handleFormatChange}
            onOpenSettings={handleOpenSettings}
            onDeleteFile={handleDeleteFile}
            onDropdownToggle={(idx: number) => { setShowDropdown(showDropdown === idx ? null : idx); }}
            isConverting={isConverting}
            conversionStatus={conversionStatus}
            conversionProgress={conversionProgress}
            conversionResults={conversionResults}
            handleDownload={handleDownload}
            buttonsVisible={buttonsVisible}
            handleClearFiles={handleClearFiles}
            handleButtonClick={handleButtonClick}
            filesAdded={filesAdded}
            uploadButtonStyles={uploadButtonStyles}
            allConversionsComplete={allConversionsComplete}
            mediaType={mediaType}
            handleConvert={handleConvert}
            hasSettings={hasSettings}
          />
        ) : (
          <FileUploader
            isDragging={isDragActive}
            filesExist={filesAdded}
            fileInputRef={fileInputRef}
            maxFileSize={MAX_FILE_SIZE_MB}
            maxFilesCount={MAX_FILES_COUNT}
            availableFormats={AVAILABLE_FORMATS}
            onButtonClick={handleButtonClick}
            uploaderType='media'
            noteLabels={['Video', 'Audio']}
          />
        )}

      </section>

      {/* Settings Modal Component */}
      {mediaType === 'audio' ? (
        <AudioSettingsModal
          isVisible={showSettings}
          fileName={files[currentFileIndex]?.name || ''}
          fileSize={files[currentFileIndex]?.size || 0}
          settings={tempSettings as AudioFileSettings}
          selectedFormat={selectedFormats[currentFileIndex] || ''}
          onSettingsChange={s => { setTempSettings(s as AudioFileSettings); }}
          onApply={handleApplySettings}
          onApplyAll={handleApplyAll}
        />
      ) : mediaType === 'video' ? (
        <VideoSettingsModal
          isVisible={showSettings}
          fileName={files[currentFileIndex]?.name || ''}
          fileSize={files[currentFileIndex]?.size || 0}
          settings={tempSettings as VideoFileSettings}
          selectedFormat={selectedFormats[currentFileIndex] || ''}
          onSettingsChange={s => { setTempSettings(s as VideoFileSettings); }}
          onApply={handleApplySettings}
          onApplyAll={handleApplyAll}
        />
      ) : null}

      {/* Render notifications */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default MediaConverterPage;