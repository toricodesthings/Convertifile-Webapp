import React from 'react';
import FileItem from './FileItem';
import styles from './fileInstruction.module.css';

interface FileInstructionProps {
  files: File[];
  deletingFileIndex: number | null;
  selectedFormats: string[];
  getAvailableFormats: (file: File) => string[];
  showDropdown: number | null;
  onFormatChange: (index: number, format: string) => void;
  onOpenSettings: (index: number) => void;
  onDeleteFile: (index: number) => void;
  onDropdownToggle: (idx: number) => void;
  isConverting: boolean;
  conversionStatus: string[];
  conversionProgress: number[];
  conversionResults: { fileUrl: string, fileName: string }[];
  handleDownload: (url: string, filename: string) => void;
  buttonsVisible: boolean;
  handleClearFiles: () => void;
  handleButtonClick: () => void;
  filesAdded: boolean;
  uploadButtonStyles: Record<string, string>;
  allConversionsComplete: boolean;
  mediaType: string;
  handleConvert: () => void;
  hasSettings: (file: File, selectedFormat: string) => boolean;
}

const FileInstruction: React.FC<FileInstructionProps> = ({
  files,
  deletingFileIndex,
  selectedFormats,
  getAvailableFormats,
  showDropdown,
  onFormatChange,
  onOpenSettings,
  onDeleteFile,
  onDropdownToggle,
  isConverting,
  conversionStatus,
  conversionProgress,
  conversionResults,
  handleDownload,
  buttonsVisible,
  handleClearFiles,
  handleButtonClick,
  filesAdded,
  uploadButtonStyles,
  allConversionsComplete,
  mediaType,
  handleConvert,
  hasSettings,
}) => {
  return (
    <div className={styles.fileInstruction}>
      <h2 className={styles.fileTitle}>
        Selected {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} ({files.length})
      </h2>
      <div className={styles.fileList}>
        {files.map((file, index) => (
          <FileItem
            key={index}
            file={file}
            index={index}
            deletingFileIndex={deletingFileIndex}
            selectedFormat={selectedFormats[index]}
            availableFormats={getAvailableFormats(file)}
            showDropdown={showDropdown}
            onFormatChange={onFormatChange}
            onOpenSettings={onOpenSettings}
            onDeleteFile={onDeleteFile}
            onDropdownToggle={onDropdownToggle}
            isConverting={isConverting}
            conversionStatus={conversionStatus[index]}
            conversionProgress={conversionProgress[index]}
            conversionResult={conversionResults[index]}
            handleDownload={handleDownload}
            hasSettings={hasSettings(file, selectedFormats[index])}
          />
        ))}
      </div>
      <div className={styles.buttonGroup}>
        <div className={styles.buttonWrapper}>
          {buttonsVisible && (
            <div className={isConverting ? styles.hiddenButton : ''}>
              <button className={styles.binButton} onClick={handleClearFiles} disabled={isConverting}>
                {/* ...existing SVGs for bin... */}
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
          {buttonsVisible && (
            <div className={isConverting ? styles.hiddenButton : ''}>
              <button className={`${filesAdded ? uploadButtonStyles.uploadBtnSmall : ""} ${uploadButtonStyles.uploadButton} ${isConverting ? styles.hiddenButton : ''}`} onClick={handleButtonClick} disabled={isConverting}>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={uploadButtonStyles["arr-2"]}><line y2={19} y1={5} x2={12} x1={12} /><line y2={12} y1={12} x2={19} x1={5} /></svg>
                <span className={uploadButtonStyles.buttonText}>Add More</span>
                <span className={uploadButtonStyles.circle} />
                <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={uploadButtonStyles["arr-1"]}><line y2={19} y1={5} x2={12} x1={12} /><line y2={12} y1={12} x2={19} x1={5} /></svg>
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
  );
};

export default FileInstruction;
