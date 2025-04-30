'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from "./imageconverter.module.css";
import fileItemStyles from "../../components/FileManagement/fileItem.module.css";
import uploadButtonStyles from "../../components/FileManagement/uploadButton.module.css";
import { convertFile } from '../../backendcaller/imageConverter';
import ImageSettingsModal, { FileSettings } from '../../components/FileManagement/SettingsComponent/ImageSettingsModal';
import FileUploader from '../../components/FileManagement/FileUploader';
import FileInstruction from '../../components/FileManagement/FileInstruction';
import NotificationContainer, { Notification } from '../../components/FileManagement/NotificationContainer';

/**
 * Image Rules
 */
const AVAILABLE_FORMATS = [['jpg', 'png', 'webp', 'bmp', 'tiff', 'ico', 'heic', 'avif', 'pdf', 'pbm', 'ppm', 'tga', 'sgi']];
const MAX_FILE_SIZE_MB = [200];
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB[0] * 1024 * 1024; // Convert MB to bytes
const MAX_FILES_COUNT = 10;

const defaultSettings: FileSettings = {
  removeMetadata: false,
  compression: true, // Default to true for formats that support compression
  quality: 90,      // Changed from 92 to 90 as requested
  formatSpecific: {
    jpg: { optimize: true },
    webp: { optimize: true },
    bmp: { compression: true },
    tga: { compression: true },
    png: { optimize: true },
    avif: { speed: 6 },
    pdf: { page_size: 'A4' },
  }
};
/**
 * ImageConverterPage component - Main page for converting images between formats
 * This component handles file selection, format conversion settings, and processing
 * 
 * @returns React component
 */
const ImageConverterPage = () => {
  // File management state
  const [files, setFiles] = useState<File[]>([]);
  const [filesAdded, setFilesAdded] = useState(false);
  const [deletingFileIndex, setDeletingFileIndex] = useState<number | null>(null);
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
  const [tempSettings, setTempSettings] = useState<FileSettings>({ ...defaultSettings });

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
    setFileSettings(files.map(() => ({ ...defaultSettings })));
  }, [files]);

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
  
  useEffect(() => {
    if (showSettings) {
      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          // Close the modal without applying settings
          setShowSettings(false);
        }
      };

      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showSettings]);

  // Check whether file is an image and get its extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  };
  const getAvailableFormats = (file: File): string[] => {
    const currentFormat = getFileExtension(file.name);
    return AVAILABLE_FORMATS[0].filter(format => format !== currentFormat);
  };
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Restrictions application
  const isFileSizeValid = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE_BYTES;
  };

  // Unified file validation and addition logic
  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    const arrFiles = Array.from(incomingFiles);

    // Check if adding the files would exceed the maximum count
    if (files.length + arrFiles.length > MAX_FILES_COUNT) {
      addNotification(`You can only add up to ${MAX_FILES_COUNT} files at a time. You already have ${files.length} files.`);
      return;
    }

    // Filter out non-image files
    const imageFiles = arrFiles.filter(isImageFile);

    // Filter out files exceeding size limit
    const validSizeFiles = imageFiles.filter(isFileSizeValid);

    // Notify about rejected files
    const rejectedForType = arrFiles.length - imageFiles.length;
    const rejectedForSize = imageFiles.length - validSizeFiles.length;

    if (rejectedForType > 0) {
      addNotification(`${rejectedForType} file(s) were rejected because they are not images.`, 'warning');
    }

    if (rejectedForSize > 0) {
      addNotification(`${rejectedForSize} file(s) were rejected because they exceed the ${MAX_FILE_SIZE_MB[0]}MB size limit.`, 'warning');
    }

    if (validSizeFiles.length > 0) {
      const newFiles = [...files, ...validSizeFiles];
      setFiles(newFiles);
      setSelectedFormats(prev => [
        ...prev,
        ...validSizeFiles.map(file => getAvailableFormats(file)[0])
      ]);

      // Initialize settings for new files
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
        validateAndAddFiles(e.target.files);
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
    
    // Direct assignment with a new array instead of using updater function
    const updatedFormats = [...selectedFormats];
    updatedFormats[index] = format;
    setSelectedFormats(updatedFormats);
    setShowDropdown(null);

    // Update compression setting based on format
    setFileSettings(prev => {
      const updated = [...prev];
      const supportedCompressionFormats = ['jpg', 'webp', 'png', 'avif', 'tiff', 'heif', 'heic'];
      
      // Set compression based on format support
      const formatSupportsCompression = supportedCompressionFormats.includes(format.toLowerCase());
      updated[index] = { 
        ...updated[index], 
        compression: formatSupportsCompression
      };
      return updated;
    });
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

  // Handle conversion process
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
        await convertFile(
          files[i],
          selectedFormats[i],
          i,
          fileSettings[i],
          setConversionStatus,
          setConversionResults,
          setConversionProgress
        );

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

  // All image files have settings
  const hasSettings = () => true;

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      validateAndAddFiles(acceptedFiles);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: true,
    multiple: true,
    maxSize: MAX_FILE_SIZE_BYTES
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Image Converter</h1>

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
          accept="image/*"
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
            mediaType='image'
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
            uploaderType='image'
            noteLabels={['Images']}
          />
        )}
      </section>

      {/* Settings Modal Component */}
      <ImageSettingsModal
        isVisible={showSettings}
        fileName={files[currentFileIndex]?.name || ''}
        fileSize={files[currentFileIndex]?.size || 0}
        settings={tempSettings}
        selectedFormat={selectedFormats[currentFileIndex] || ''}
        onSettingsChange={setTempSettings}
        onApply={handleApplySettings}
        onApplyAll={handleApplyAll}
      />
      
      {/* Render notifications */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default ImageConverterPage;