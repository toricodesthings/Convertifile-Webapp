import React, { useRef } from 'react';
import fileItemStyles from './fileItem.module.css';
import { createPortal } from 'react-dom';

interface FileItemProps {
  file: File;
  index: number;
  deletingFileIndex: number | null;
  selectedFormat: string;
  availableFormats: string[];
  showDropdown: number | null;
  onFormatChange: (index: number, format: string) => void;
  onOpenSettings: (index: number) => void;
  onDeleteFile: (index: number) => void;
  onDropdownToggle: (index: number) => void;
  isConverting: boolean;
  conversionStatus: string;
  conversionProgress: number;
  conversionResult?: { fileUrl: string, fileName: string };
  handleDownload?: (url: string, filename: string) => void;
  hasSettings?: boolean;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  index,
  deletingFileIndex,
  selectedFormat,
  availableFormats,
  showDropdown,
  onFormatChange,
  onOpenSettings,
  onDeleteFile,
  onDropdownToggle,
  isConverting,
  conversionStatus,
  conversionProgress,
  conversionResult,
  handleDownload,
  hasSettings = true
}) => {
  // Each FileItem gets its own ref for correct dropdown positioning
  const formatSelectorRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`${fileItemStyles.fileItem} ${deletingFileIndex === index ? fileItemStyles.deletingItem : ''}`}
      style={{ animationDelay: `${0.1 * index}s` }}
    >
      <span className={fileItemStyles.fileName}>{file.name}</span>
      <div className={fileItemStyles.fileActions}>
        {isConverting ? (
          <>
            {conversionStatus && (
              <div className={fileItemStyles.fileActions}>
                <div className={fileItemStyles.conversionStatus}>
                  {!conversionStatus.includes('Completed!') &&
                    !conversionStatus.includes('Failed') &&
                    !conversionStatus.includes('Timed out') ? (
                    <div className={fileItemStyles.loaderBar}>
                      <div
                        className={fileItemStyles.loaderProgress}
                        style={{ width: `${conversionProgress}%` }}
                      />
                    </div>
                  ) : null}
                  <span>
                    {conversionStatus}
                  </span>
                  {conversionResult?.fileUrl && handleDownload && (
                    <button
                      className={fileItemStyles.downloadButton}
                      onClick={() => handleDownload(conversionResult.fileUrl, conversionResult.fileName)}
                    >
                      <svg className={fileItemStyles.downloadIcon} viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg"><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" /></svg>
                      <span className={fileItemStyles.iconTwo} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={fileItemStyles.fileActions}>
              <div className={fileItemStyles.formatSelector} ref={formatSelectorRef}>
                <button
                  className={fileItemStyles.dropdownToggle}
                  onClick={() => { onDropdownToggle(index); }}
                >
                  <span>
                    {selectedFormat ? `${selectedFormat}` : 'Select format'}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="1em"
                      viewBox="0 0 512 512"
                      className={`${fileItemStyles.dropdownArrow} ${showDropdown === index ? fileItemStyles.arrowRotate : ''}`}
                    >
                      <path
                        d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                      ></path>
                    </svg>
                  </span>
                </button>
                {showDropdown === index && createPortal(
                  <div
                    className={fileItemStyles.formatDropdown}
                    style={{
                      position: 'fixed',
                      top: formatSelectorRef.current?.getBoundingClientRect().bottom ?? 0,
                      left: formatSelectorRef.current?.getBoundingClientRect().left ?? 0,
                      minWidth: formatSelectorRef.current?.offsetWidth || 'auto'
                    }}
                  >
                    {availableFormats.map(format => (
                      <div
                        key={format}
                        className={fileItemStyles.formatOption}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onFormatChange(index, format);
                        }}
                      >
                        {format}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
              {hasSettings && (
                <button className={fileItemStyles.settingBtn} onClick={() => { onOpenSettings(index); }}>
                  <span className={`${fileItemStyles.bar} ${fileItemStyles.bar1}`}></span>
                  <span className={`${fileItemStyles.bar} ${fileItemStyles.bar2}`}></span>
                  <span className={`${fileItemStyles.bar} ${fileItemStyles.bar1}`}></span>
                </button>
              )}
              <button className={fileItemStyles.deleteBtn} onClick={() => { onDeleteFile(index); }}>
                <svg
                  className={fileItemStyles.xIcon}
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
  );
};

export default FileItem;
