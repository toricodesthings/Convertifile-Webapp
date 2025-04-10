'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from "./imageconverter.module.css";
import { convertFile } from '../../backendcaller/imageConverter';
import SettingsModal, { FileSettings } from '../../components/FileManagement/SettingsModal';
import FileUploader from '../../components/FileManagement/FileUploader';

/**
 * Available formats for image conversion
 */
const AVAILABLE_FORMATS = ['jpg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'heic', 'avif', 'pdf'];

/**
 * ImageConverterPage component - Main page for converting images between formats
 * This component handles file selection, format conversion settings, and processing
 * 
 * @returns React component
 */
const ImageConverterPage = () => {
  const defaultSettings: FileSettings = {
    removeMetadata: false,
    compression: false,
    quality: 100,
    formatSpecific: {
      webp: {
        optimize: true
      },
      bmp: {
        compression: true 
      },
      png: {
        optimize: true
      },
      tiff: {
        compression: "lzw"
      },
      avif: {
        speed: 6
      }
    }
  };
  // File handling states
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [filesAdded, setFilesAdded] = useState(false);
  const [deletingFileIndex, setDeletingFileIndex] = useState<number | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string[]>([]);
  const [conversionProgress, setConversionProgress] = useState<number[]>([]);
  const [conversionResults, setConversionResults] = useState<{ fileUrl: string, fileName: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const formatSelectorRef = useRef<HTMLDivElement>(null);
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [allConversionsComplete, setAllConversionsComplete] = useState(false);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const [fileSettings, setFileSettings] = useState<FileSettings[]>([]);
  const [tempSettings, setTempSettings] = useState<FileSettings>({...defaultSettings});

  // Track when files are added to trigger animations
  useEffect(() => {
    if (files.length > 0) {
      setFilesAdded(true);
    }
  }, [files]);

// Initialize settings for new files
  useEffect(() => {
    setFileSettings(files.map(() => ({...defaultSettings})));
  }, [files.length]); // Remove defaultSettings from dependencies

  const [buttonsVisible, setButtonsVisible] = useState(true);

  // Add this effect to handle transitions
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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConverting]);

  useEffect(() => {
    if (showDropdown !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        // Cast the event target to Element to check if it's a node that matches our selectors
        const target = event.target as Element;

        // Check if the click was outside both the dropdown and the toggle button
        const isOutsideDropdown = !target.closest(`.${styles.formatDropdown}`);
        const isOutsideToggle = !target.closest(`.${styles.dropdownToggle}`);

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
  }, [showDropdown, styles]);

  /**
   * Handle drag enter event
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Get file extension from filename
   */
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  /**
   * Get available formats excluding the current format
   */
  const getAvailableFormats = (file: File): string[] => {
    const currentFormat = getFileExtension(file.name);
    return AVAILABLE_FORMATS.filter(format => format !== currentFormat);
  };

  /**
   * Check if file is an image based on MIME type
   */
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  /**
   * Handle file drop event
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const imageFiles = droppedFiles.filter(isImageFile);

      if (imageFiles.length < droppedFiles.length) {
        alert(`${droppedFiles.length - imageFiles.length} file(s) were rejected because they are not images.`);
      }

      if (imageFiles.length > 0) {
        const newFiles = [...files, ...imageFiles];
        setFiles(newFiles);
        setSelectedFormats(prev => [
          ...prev,
          ...imageFiles.map(file => getAvailableFormats(file)[0])
        ]);

        // Initialize settings for new files
        setFileSettings(prev => [
          ...prev,
          ...imageFiles.map(() => ({...defaultSettings}))
        ]);

        e.dataTransfer.clearData();
        setFilesAdded(true);
      }
    }
  };

  /**
   * Handle file selection from input
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const imageFiles = selectedFiles.filter(isImageFile);

      if (imageFiles.length < selectedFiles.length) {
        alert(`${selectedFiles.length - imageFiles.length} file(s) cannot be added because they are not images.`);
      }

      if (imageFiles.length > 0) {
        const newFiles = [...files, ...imageFiles];
        setFiles(newFiles);
        setSelectedFormats(prev => [
          ...prev,
          ...imageFiles.map(file => getAvailableFormats(file)[0])
        ]);

        // Initialize settings for new files
        setFileSettings(prev => [
          ...prev,
          ...imageFiles.map(() => ({...defaultSettings}))
        ]);

        setFilesAdded(true);
      }
    }
  };

  /**
   * Handle file input button click
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Clear all files
   */
  const handleClearFiles = () => {
    setFiles([]);
    setFilesAdded(false);
    setSelectedFormats([]);
    setConversionStatus([]);
    setFileSettings([]);
  };

  /**
   * Handle format change for a specific file
   */
  const handleFormatChange = (index: number, format: string) => {
    setSelectedFormats(prev => {
      const updated = [...prev];
      updated[index] = format;
      return updated;
    });
    setShowDropdown(null);
  };

  /**
   * Handle file deletion with animation
   */
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
    }, 300); // Match this to the animation duration
  };

  /**
   * Open settings modal for a specific file
   */
  const handleOpenSettings = (index: number) => {
    setCurrentFileIndex(index);
    setTempSettings({ ...fileSettings[index] });
    setShowSettings(true);
  };

  /**
   * Apply settings from the modal
   */
  const handleApplySettings = () => {
    setFileSettings(prev => {
      const updated = [...prev];
      updated[currentFileIndex] = { ...tempSettings };
      return updated;
    });
    setShowSettings(false);
  };

  /**
   * Handle conversion for all files
   */
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

  /**
   * Handle downloading a converted file
   */
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Image Converter</h1>

      <section
        className={`${styles.uploadSection} ${isDragging ? styles.dragging : ''} ${showSettings ? styles.blurredContent : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className={styles.dropOverlay}>
            <p>Drop Files Here</p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*"
          style={{ display: 'none' }}
        />

        {files.length > 0 ? (
          <div className={styles.fileInstruction}>
            <h2 className={styles.fileTitle}>Selected Files ({files.length})</h2>

            <div className={styles.fileList}>
              {files.map((file, index) => (
                <div
                  className={`${styles.fileItem} ${deletingFileIndex === index ? styles.deletingItem : ''}`}
                  key={index}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <span className={styles.fileName}>{file.name}</span>
                  <div className={styles.fileActions}>
                    {isConverting ? (
                      <>
                        {conversionStatus[index] && (
                          <div className={styles.fileActions}>
                            <div className={styles.conversionStatus}>
                              {!conversionStatus[index].includes('Completed!') &&
                                !conversionStatus[index].includes('Failed') &&
                                !conversionStatus[index].includes('Timed out') ? (
                                <div className={styles.loaderBar}>
                                  <div
                                    className={styles.loaderProgress}
                                    style={{ width: `${conversionProgress[index]}%` }}
                                  />
                                </div>
                              ) : null}
                              <span>
                                {conversionStatus[index]}
                              </span>
                              {conversionResults[index]?.fileUrl && (
                                
                                <button
                                  className={styles.downloadButton}
                                  onClick={() => handleDownload(
                                    conversionResults[index].fileUrl,
                                    conversionResults[index].fileName
                                  )}
                                >
                                  <svg className={styles.downloadIcon} viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" /></svg>
                                  <span className={styles.iconTwo} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={styles.fileActions}>
                          <div className={styles.formatSelector} ref={formatSelectorRef}>
                            <button
                              className={styles.dropdownToggle}
                              onClick={() => setShowDropdown(showDropdown === index ? null : index)}
                            >
                              <span>
                                {selectedFormats[index] ? `${selectedFormats[index]}` : 'Select format'}

                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="1em"
                                  viewBox="0 0 512 512"
                                  className={`${styles.dropdownArrow} ${showDropdown !== null ? styles.arrowRotate : ''}`}
                                >
                                  <path
                                    d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                                  ></path>
                                </svg>
                              </span>
                            </button>

                            {showDropdown === index && createPortal(
                              <div
                                className={styles.formatDropdown}
                                style={{
                                  position: 'fixed', // Change to fixed positioning
                                  top: formatSelectorRef.current?.getBoundingClientRect().bottom || 0,
                                  left: formatSelectorRef.current?.getBoundingClientRect().left || 0,
                                }}
                              >
                                {getAvailableFormats(file).map(format => (
                                  <div
                                    key={format}
                                    className={styles.formatOption}
                                    onClick={() => handleFormatChange(index, format)}
                                  >
                                    {format}
                                  </div>
                                ))}
                              </div>,
                              document.body
                            )}
                          </div>
                          <button className={styles.settingBtn} onClick={() => handleOpenSettings(index)}>
                            <span className={`${styles.bar} ${styles.bar1}`}></span>
                            <span className={`${styles.bar} ${styles.bar2}`}></span>
                            <span className={`${styles.bar} ${styles.bar1}`}></span>
                          </button>

                          <button className={styles.deleteBtn} onClick={() => handleDeleteFile(index)}>
                            <svg
                              className={styles.xIcon}
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.buttonGroup}>
              <div className={styles.buttonWrapper}>
                {(buttonsVisible) && (
                  <div className={isConverting ? styles.hiddenButton : ''}>
                    <button className={styles.binButton} onClick={handleClearFiles} disabled={isConverting}>
                      <svg
                        className={styles.binTop}
                        viewBox="0 0 39 7"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <line y1="5" x2="39" y2="5" stroke="currentColor" strokeWidth="4"></line>
                        <line
                          x1="12"
                          y1="1.5"
                          x2="26.0357"
                          y2="1.5"
                          stroke="currentColor"
                          strokeWidth="3"
                        ></line>
                      </svg>
                      <svg
                        className={styles.binBottom}
                        viewBox="0 0 33 39"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <mask id="path-1-inside-1_8_19" fill="white">
                          <path
                            d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                          ></path>
                        </mask>
                        <path
                          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                          fill="currentColor"
                          mask="url(#path-1-inside-1_8_19)"
                        ></path>
                        <path d="M12 6L12 29" stroke="currentColor" strokeWidth="4"></path>
                        <path d="M21 6V29" stroke="currentColor" strokeWidth="4"></path>
                      </svg>
                    </button>
                  </div>
                )}
                <div className={styles.rightButtons}>
                  {(buttonsVisible) && (
                    <div className={isConverting ? styles.hiddenButton : ''}>
                      <button className={`${styles.uploadMoreButton} ${isConverting ? styles.hiddenButton : ''}`} onClick={handleButtonClick} disabled={isConverting}>
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={styles["arr-2"]}><line y2={19} y1={5} x2={12} x1={12} /><line y2={12} y1={12} x2={19} x1={5} /></svg>
                        <span className={styles.buttonText}>Add More</span>
                        <span className={styles.circle} />
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={styles["arr-1"]}><line y2={19} y1={5} x2={12} x1={12} /><line y2={12} y1={12} x2={19} x1={5} /></svg>
                      </button>
                    </div>
                  )}
                  <button
                    className={`${styles.confirmButton} ${isConverting || allConversionsComplete ? styles.converting : ''}`}
                    onClick={handleConvert}
                    disabled={(isConverting && !allConversionsComplete) || (!allConversionsComplete && files.length === 0)}
                  >
                    <span className={styles.buttonText}>
                      {isConverting && !allConversionsComplete
                        ? 'Converting...'
                        : allConversionsComplete
                          ? 'Convert More'
                          : 'Convert'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <FileUploader
            isDragging={isDragging}
            filesExist={filesAdded}
            fileInputRef={fileInputRef}
            onButtonClick={handleButtonClick}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        )}

        {files.length === 0 && (
          <p className={styles.uploaderNote}>
            Supported Formats: JPG, PNG, GIF, BMP, TIFF, WEBP
            | Files will only be stored for 10 minutes.
          </p>
        )}
      </section>

      {/* Settings Modal Component */}
      <SettingsModal
        isVisible={showSettings}
        fileName={files[currentFileIndex]?.name || ''}
        fileSize={files[currentFileIndex]?.size || 0}
        settings={tempSettings}
        selectedFormat={selectedFormats[currentFileIndex] || ''}
        onSettingsChange={setTempSettings}
        onApply={handleApplySettings}
      />
    </div>
  );
};

export default ImageConverterPage;