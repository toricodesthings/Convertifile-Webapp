'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from "./giftool.module.css";
import { gifConvertFile } from '../../backendcaller/gifConverter';
import GifSettingsModal, { FileSettings } from '../../components/FileManagement/SettingsComponent/GifSettingsModal';
import FileUploader from '../../components/FileManagement/FileUploader';
import NotificationContainer, { Notification } from '../../components/FileManagement/NotificationContainer';
import GifFileInstruction from '../../components/FileManagement/GifFileInstruction';

/**
 * GIF Conversion Rules
 */
const AVAILABLE_FORMATS = [['gif']]; // Only convert to GIF format
const MAX_FILE_SIZE_MB = [250];
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB[0] * 1024 * 1024;
const MAX_FILES_COUNT = 1; // Only allow 1 video at a time
const MAX_VIDEO_DURATION = 60; // Maximum video duration in seconds

// Default settings for GIF conversion
const defaultSettings: FileSettings = {
  removeMetadata: false,
  quality: 85,
  fps: 15, 
  width: null, 
  height: null, 
  maintainAspectRatio: true,
  loop: true, 
  dither: true, 
};

/**
 * GifToolPage component - Main page for converting videos to GIF format
 * This component handles file selection, format conversion settings, and processing
 * 
 * @returns React component
 */
const GifToolPage = () => {  // File management state
  const [file, setFile] = useState<File | null>(null);
  const [filesAdded, setFilesAdded] = useState(false);
  const [fileSettings, setFileSettings] = useState<FileSettings>(defaultSettings);
  const [tempSettings, setTempSettings] = useState<FileSettings>({ ...defaultSettings });
  
  // UI references and drag-drop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionResult, setConversionResult] = useState<{ fileUrl: string, fileName: string } | null>(null);
  const [allConversionsComplete, setAllConversionsComplete] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Video duration check state
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Video trimming state
  const [trimStartTime, setTrimStartTime] = useState<number>(0);
  const [trimEndTime, setTrimEndTime] = useState<number>(0);
  
  useEffect(() => {
    // Add cleanup for notifications timeouts
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);
    // Add notification helper
  const addNotification = (message: string, type: 'success' | 'warning' | 'error' = 'error') => {
    const id = `${Date.now()}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };
  
  // Remove notification helper
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Check video duration using HTML5 video element

const checkVideoDuration = (videoFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        const videoURL = URL.createObjectURL(videoFile);

        videoElement.onloadedmetadata = () => {
            const duration = videoElement.duration;
            URL.revokeObjectURL(videoURL);
            setVideoDuration(duration);
            resolve(duration);
        };

        videoElement.onerror = () => {
            URL.revokeObjectURL(videoURL);
            reject(new Error('Unable to load video metadata'));
        };

        videoElement.src = videoURL;
    });
};
  // Validate file and add to state
  const validateAndAddFile = async (videoFile: File) => {
    // Check if the file is a video
    if (!videoFile.type.startsWith('video/')) {
      addNotification('Selected file is not a video. Please upload a video file.', 'error');
      return;
    }

    // Check file size
    if (videoFile.size > MAX_FILE_SIZE_BYTES) {
      addNotification(`The file is too large. Maximum allowed file size is ${MAX_FILE_SIZE_MB[0]}MB.`, 'error');
      return;
    }    try {
      // Check video duration
      const duration = await checkVideoDuration(videoFile);
      
      if (duration > MAX_VIDEO_DURATION) {
        addNotification(`Video is too long. Maximum duration allowed is ${MAX_VIDEO_DURATION} seconds.`, 'error');
        return;
      }
        // All checks passed, add the file
      setFile(videoFile);
      setFileSettings({ ...defaultSettings });
      setFilesAdded(true);
      
    } catch (error) {
      console.error('Error checking video file:', error);
      addNotification('Error validating video file. Please try a different file.', 'error');
    }
  };

  // Handle file selection from button input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (e.target.files && e.target.files.length > 0) {
        // Only process the first file
        const selectedFile = e.target.files[0];
        validateAndAddFile(selectedFile);
      }
    }, 0);
  };

  // Handle button click to open file input dialog
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  // Handle clearing file
  const handleClearFile = () => {
    setFile(null);
    setFilesAdded(false);
    setConversionStatus('');
    setConversionProgress(0);
    setConversionResult(null);
    setFileSettings({ ...defaultSettings });
    setVideoDuration(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle delete file (we only have one file so this is same as clear)
  const handleDeleteFile = () => {
    handleClearFile();
  };

  // Handle opening settings modal
  const handleOpenSettings = () => {
    setTempSettings({ ...fileSettings });
    setShowSettings(true);
  };
  // Handle applying settings from the modal
  const handleApplySettings = () => {
    setFileSettings({ ...tempSettings });
    setShowSettings(false);
  };
  // Handle trim time changes
  const handleTrimChange = (startTime: number, endTime: number) => {
    setTrimStartTime(startTime);
    setTrimEndTime(endTime);
  };

  // Handle conversion process
  const handleConvert = async (startTime?: number, endTime?: number) => {
    if (!file) return;
    
    if (allConversionsComplete) {
      // Reset everything
      handleClearFile();
      return;
    }

    const actualStartTime = startTime ?? trimStartTime;
    const actualEndTime = endTime ?? trimEndTime;

    setIsConverting(true);
    setAllConversionsComplete(false);
    setConversionStatus('Starting conversion...');
    setConversionProgress(0);
    setConversionResult(null);

    // Set up wrapper functions to properly update state for a single file
    const updateStatus = (updater: (prev: string[]) => string[]) => {
      const newStatus = updater([''])[0];
      setConversionStatus(newStatus);
    };

    const updateProgress = (updater: (prev: number[]) => number[]) => {
      const newProgress = updater([0])[0]; 
      setConversionProgress(newProgress);
    };

    const updateResult = (updater: (prev: { fileUrl: string, fileName: string }[]) => { fileUrl: string, fileName: string }[]) => {
      const newResult = updater([{ fileUrl: '', fileName: '' }])[0];
      setConversionResult(newResult);
    };

    try {      // Use the gifConvertFile function for GIF conversion with trim parameters
      await gifConvertFile(
        file,
        'gif',
        0,
        { ...fileSettings, startTime: actualStartTime, endTime: actualEndTime }, // Add trim parameters to settings
        updateStatus,
        updateResult,
        updateProgress
      );
      
      // Check if conversion is complete
      setAllConversionsComplete(true);
    } catch (error) {
      console.error(`Error converting file:`, error);
      setConversionStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle downloading converted file
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      // Only take the first file
      validateAndAddFile(acceptedFiles[0]);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: {
      'video/*': []
    },
    noClick: true,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Video to GIF Converter</h1>

      <section
        {...getRootProps({
          className:
            `${styles.uploadSection} ${filesAdded ? styles.solid : styles.dashed} ${isDragActive ? styles.dragging : ''} ${showSettings ? styles.blurredContent : ''}`
        })}
      >
        {isDragActive && (
          <div className={styles.dropOverlay}>
            <p>Drop a Video Here</p>
          </div>
        )}

        {/* Use dropzone's getInputProps for drag-and-drop, keep hidden input for manual click */}
        <input {...getInputProps()} style={{ display: 'none' }} />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />        {file ? (
          <>
            <GifFileInstruction
              file={file}
              videoDuration={videoDuration}
              isConverting={isConverting}
              onSettingsClick={handleOpenSettings}
              onDeleteFile={handleDeleteFile}
              onConvert={handleConvert}
              onTrimChange={handleTrimChange}
            />
            
            {/* Display conversion progress and results */}
            {isConverting && (
              <div className={styles.conversionStatus}>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${conversionProgress}%` }}
                  ></div>
                </div>
                <p>{conversionStatus}</p>
              </div>
            )}
            
            {conversionResult && (
              <div className={styles.conversionResult}>
                <div className={styles.gifPreview}>
                  <img src={conversionResult.fileUrl} alt="Converted GIF" />
                </div>
                <button 
                  className={styles.downloadButton} 
                  onClick={() => handleDownload(conversionResult.fileUrl, conversionResult.fileName)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download GIF
                </button>
              </div>
            )}
          </>
        ) : (
          <FileUploader
            isDragging={isDragActive}
            filesExist={filesAdded}
            fileInputRef={fileInputRef}
            maxFileSize={MAX_FILE_SIZE_MB}
            maxFilesCount={MAX_FILES_COUNT}
            availableFormats={AVAILABLE_FORMATS}
            onButtonClick={handleButtonClick}
            uploaderType='gif'
            noteLabels={['Video']}
          />
        )}
      </section>      {/* Settings Modal Component */}
      <GifSettingsModal
        isVisible={showSettings}
        fileName={file?.name || ''}
        fileSize={file?.size || 0}
        settings={tempSettings}
        onSettingsChange={setTempSettings}
        onApply={handleApplySettings}
      />
      
      {/* Render notifications */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default GifToolPage;