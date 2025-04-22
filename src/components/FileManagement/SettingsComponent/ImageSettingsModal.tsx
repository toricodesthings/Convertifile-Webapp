import React, { useState, useRef } from 'react';
import styles from './settings.module.css'; 
import checkboxStyles from '../checkbox.module.css';
import dropdownStyles from '../dropdown.module.css';
import SettingsCheckbox from '../SettingsCheckbox';
import SettingsSlider from '../SettingsSlider';
import DropDown from '../DropDown';

export interface FileSettings {
  removeMetadata: boolean;
  compression: boolean;
  quality: number;
  formatSpecific: {
    jpg: {
      optimize: boolean;
    }
    webp: {
      optimize: boolean;
    };
    bmp: {
      compression: boolean;
    };
    tga: {
      compression: boolean;
    };
    png: {
      optimize: boolean;
    };
    avif: {
      speed: number;
    };
    pdf: {
      page_size: string;
    };
  };
}

interface SettingsModalProps {
  isVisible: boolean;
  fileName: string;
  fileSize?: number;
  settings: FileSettings;
  selectedFormat: string;
  onSettingsChange: (settings: FileSettings) => void;
  onApply: () => void;
}

// --- Helper data and types ---
type ImageFormat = 'jpg' | 'webp' | 'bmp' | 'tga' | 'png' | 'avif' | 'pdf';

// Page size options (matching backend)
const PAGE_SIZES = ['A3', 'A4', 'A5', 'LETTER', 'LEGAL', 'TABLOID'];

// Format specific rendering helpers
const supportsCompression = (format: string): boolean => {
  return ['jpg', 'webp', 'png', 'avif', 'tiff', 'heif', 'heic'].includes(format.toLowerCase());
};

// Type guard functions
const hasOptimize = (format: ImageFormat): boolean => {
  return ['jpg', 'webp', 'png'].includes(format);
};

const hasCompression = (format: ImageFormat): boolean => {
  return ['bmp', 'tga'].includes(format);
};

const hasSpeed = (format: ImageFormat): boolean => {
  return ['avif'].includes(format);
};

const hasPageSize = (format: ImageFormat): boolean => {
  return ['pdf'].includes(format);
};

// Warning messages for specific formats
const FORMAT_WARNINGS: Partial<Record<ImageFormat, string>> = {
  'bmp': 'BMP files without compression can be extremely large.'
};

/**
 * ImageSettingsModal component for configuring image conversion settings
 */
const ImageSettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  fileName,
  fileSize,
  settings,
  selectedFormat,
  onSettingsChange,
  onApply
}) => {
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null);
  
  if (!isVisible) return null;
  
  const formatFileSize = (size?: number): string => {
    if (!size) return '';
    
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  // Helper to render optimize checkbox for supported formats
  const renderOptimizeCheckbox = (format: ImageFormat) => {
    if (!hasOptimize(format)) return null;
    
    const fs = settings.formatSpecific[format] || {};
    const label = format === 'jpg' ? 'Optimize Codec Selection (Recommended)' :
                  format === 'webp' ? 'Optimize Compression Quality' :
                  format === 'png' ? 'Optimize PNG (Recommended)' : 'Optimize';
    
    return (
      <SettingsCheckbox
        checked={'optimize' in fs ? fs.optimize : true}
        onChange={checked =>
          onSettingsChange({
            ...settings,
            formatSpecific: {
              ...settings.formatSpecific,
              [format]: {
                ...fs,
                optimize: checked
              }
            }
          })
        }
      >
        <p className={checkboxStyles.checkboxTextwrapper}>{label}</p>
      </SettingsCheckbox>
    );
  };

  // Helper to render compression checkbox for supported formats
  const renderCompressionCheckbox = (format: ImageFormat) => {
    if (!hasCompression(format)) return null;
    
    const fs = settings.formatSpecific[format] || {};
    const isRecommended = format === 'bmp';
    
    return (
      <>
        <SettingsCheckbox
          checked={'compression' in fs ? fs.compression : true}
          onChange={checked =>
            onSettingsChange({
              ...settings,
              formatSpecific: {
                ...settings.formatSpecific,
                [format]: {
                  ...fs,
                  compression: checked
                }
              }
            })
          }
        >
          <p className={checkboxStyles.checkboxTextwrapper}>
            Use RLE Compression
            {isRecommended && <span className={styles.warningText}> (Recommended)</span>}
          </p>
        </SettingsCheckbox>
        
        {/* Show warning for specific formats when compression is disabled */}
        {'compression' in fs && !fs.compression && FORMAT_WARNINGS[format] && (
          <div className={styles.warning}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Note: {FORMAT_WARNINGS[format]}
          </div>
        )}
      </>
    );
  };

  // Helper to render speed slider for supported formats
  const renderSpeedSlider = (format: ImageFormat) => {
    if (!hasSpeed(format)) return null;
    
    const fs = settings.formatSpecific[format] || {};
    const currentSpeed = 'speed' in fs ? fs.speed : 0;
    
    return (
      <SettingsSlider
        label="Encoder Speed (Lower = Better Quality):"
        min={0}
        max={10}
        value={currentSpeed}
        onChange={val =>
          onSettingsChange({
            ...settings,
            formatSpecific: {
              ...settings.formatSpecific,
              [format]: {
                ...fs,
                speed: val
              }
            }
          })
        }
        valueDisplay={currentSpeed}
      />
    );
  };

  // Helper to render page size dropdown for PDF format
  const renderPageSizeDropdown = (format: ImageFormat) => {
    if (!hasPageSize(format)) return null;
    
    const fs = settings.formatSpecific[format] || {};
    const currentPageSize = 'page_size' in fs ? fs.page_size : 'A4';
    
    return (
      <DropDown
        label="Page Size:"
        open={pageSizeOpen}
        setOpen={setPageSizeOpen}
        dropdownRef={pageSizeDropdownRef as React.RefObject<HTMLDivElement>}
        containerClassName={dropdownStyles.dropdownContainer}
        labelClassName={dropdownStyles.dropdownLabel}
        dropdownClassName={dropdownStyles.customDropdown + (pageSizeOpen ? ' ' + dropdownStyles.open : '')}
        menuClassName={dropdownStyles.customDropdownMenu}
        trigger={
          <button
            type="button"
            className={dropdownStyles.customDropdownTrigger}
            onClick={() => setPageSizeOpen(o => !o)}
            aria-expanded={pageSizeOpen}
          >
            {currentPageSize}
            <span className={dropdownStyles.customDropdownArrow + (pageSizeOpen ? ' ' + dropdownStyles.open : '')}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        }
      >
        {PAGE_SIZES.map((size) => (
          <button
            type="button"
            key={size}
            className={`${dropdownStyles.customDropdownOption}${currentPageSize === size ? ' ' + dropdownStyles.selected : ''}`}
            tabIndex={pageSizeOpen ? 0 : -1}
            onClick={() => {
              onSettingsChange({
                ...settings,
                formatSpecific: {
                  ...settings.formatSpecific,
                  [format]: {
                    ...fs,
                    page_size: size
                  }
                }
              });
              setPageSizeOpen(false);
            }}
          >
            {size}
          </button>
        ))}
      </DropDown>
    );
  };

  const renderFormatSpecificSettings = () => {
    const format = selectedFormat.toLowerCase() as ImageFormat;
    
    // Check if this is a valid image format
    if (!['jpg', 'webp', 'bmp', 'tga', 'png', 'avif', 'pdf'].includes(format)) {
      return null;
    }
    
    // Format-specific title
    const formatTitle = format === 'jpg' ? 'JPEG' : format.toUpperCase();
    
    return (
      <div className={styles.formatSpecificSettings}>
        <h4>{formatTitle} Specific Settings</h4>
        
        {/* Render appropriate settings based on format */}
        {renderOptimizeCheckbox(format)}
        {renderCompressionCheckbox(format)}
        {renderSpeedSlider(format)}
        {renderPageSizeDropdown(format)}
      </div>
    );
  };

  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsContainer}>
        <h2 className={styles.settingsTitle}>
          <span><svg className={styles.gearIcon} viewBox="0 0 24 24" fill="none">
            <path d="M12 8.25C9.92894 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92894 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z" fill="#1C274C"></path>
            <path d="M11.9747 1.25C11.5303 1.24999 11.1592 1.24999 10.8546 1.27077C10.5375 1.29241 10.238 1.33905 9.94761 1.45933C9.27379 1.73844 8.73843 2.27379 8.45932 2.94762C8.31402 3.29842 8.27467 3.66812 8.25964 4.06996C8.24756 4.39299 8.08454 4.66251 7.84395 4.80141C7.60337 4.94031 7.28845 4.94673 7.00266 4.79568C6.64714 4.60777 6.30729 4.45699 5.93083 4.40743C5.20773 4.31223 4.47642 4.50819 3.89779 4.95219C3.64843 5.14353 3.45827 5.3796 3.28099 5.6434C3.11068 5.89681 2.92517 6.21815 2.70294 6.60307L2.67769 6.64681C2.45545 7.03172 2.26993 7.35304 2.13562 7.62723C1.99581 7.91267 1.88644 8.19539 1.84541 8.50701C1.75021 9.23012 1.94617 9.96142 2.39016 10.5401C2.62128 10.8412 2.92173 11.0602 3.26217 11.2741C3.53595 11.4461 3.68788 11.7221 3.68786 12C3.68785 12.2778 3.53592 12.5538 3.26217 12.7258C2.92169 12.9397 2.62121 13.1587 2.39007 13.4599C1.94607 14.0385 1.75012 14.7698 1.84531 15.4929C1.88634 15.8045 1.99571 16.0873 2.13552 16.3727C2.26983 16.6469 2.45535 16.9682 2.67758 17.3531L2.70284 17.3969C2.92507 17.7818 3.11058 18.1031 3.28089 18.3565C3.45817 18.6203 3.64833 18.8564 3.89769 19.0477C4.47632 19.4917 5.20763 19.6877 5.93073 19.5925C6.30717 19.5429 6.647 19.3922 7.0025 19.2043C7.28833 19.0532 7.60329 19.0596 7.8439 19.1986C8.08452 19.3375 8.24756 19.607 8.25964 19.9301C8.27467 20.3319 8.31403 20.7016 8.45932 21.0524C8.73843 21.7262 9.27379 22.2616 9.94761 22.5407C10.238 22.661 10.5375 22.7076 10.8546 22.7292C11.1592 22.75 11.5303 22.75 11.9747 22.75H12.0252C12.4697 22.75 12.8407 22.75 13.1454 22.7292C13.4625 22.7076 13.762 22.661 14.0524 22.5407C14.7262 22.2616 15.2616 21.7262 15.5407 21.0524C15.686 20.7016 15.7253 20.3319 15.7403 19.93C15.7524 19.607 15.9154 19.3375 16.156 19.1985C16.3966 19.0596 16.7116 19.0532 16.9974 19.2042C17.3529 19.3921 17.6927 19.5429 18.0692 19.5924C18.7923 19.6876 19.5236 19.4917 20.1022 19.0477C20.3516 18.8563 20.5417 18.6203 20.719 18.3565C20.8893 18.1031 21.0748 17.7818 21.297 17.3969L21.3223 17.3531C21.5445 16.9682 21.7301 16.6468 21.8644 16.3726C22.0042 16.0872 22.1135 15.8045 22.1546 15.4929C22.2498 14.7697 22.0538 14.0384 21.6098 13.4598C21.3787 13.1586 21.0782 12.9397 20.7378 12.7258C20.464 12.5538 20.3121 12.2778 20.3121 11.9999C20.3121 11.7221 20.464 11.4462 20.7377 11.2742C21.0783 11.0603 21.3788 10.8414 21.6099 10.5401C22.0539 9.96149 22.2499 9.23019 22.1547 8.50708C22.1136 8.19546 22.0043 7.91274 21.8645 7.6273C21.7302 7.35313 21.5447 7.03183 21.3224 6.64695L21.2972 6.60318C21.0749 6.21825 20.8894 5.89688 20.7191 5.64347C20.5418 5.37967 20.3517 5.1436 20.1023 4.95225C19.5237 4.50826 18.7924 4.3123 18.0692 4.4075C17.6928 4.45706 17.353 4.60782 16.9975 4.79572C16.7117 4.94679 16.3967 4.94036 16.1561 4.80144C15.9155 4.66253 15.7524 4.39297 15.7403 4.06991C15.7253 3.66808 15.686 3.2984 15.5407 2.94762C15.2616 2.27379 14.7262 1.73844 14.0524 1.45933C13.762 1.33905 13.4625 1.29241 13.1454 1.27077C12.8407 1.24999 12.4697 1.24999 12.0252 1.25H11.9747Z" fill="#1C274C"></path>
          </svg>
          Image Settings</span>
        </h2>
        <h3 className={styles.settingsfileName}>
          {fileName} {fileSize && `(${formatFileSize(fileSize)})`}
        </h3>
        <div className={styles.settingOption}>
          <SettingsCheckbox
            checked={settings.removeMetadata}
            onChange={checked =>
              onSettingsChange({
                ...settings,
                removeMetadata: checked
              })
            }
          >
            <p className={checkboxStyles.checkboxTextwrapper}>Remove Image Metadata (EXIF)</p>
          </SettingsCheckbox>
          
          {/* Only show compression checkbox and quality slider for supported formats */}
          {supportsCompression(selectedFormat) && (
            <>
              <SettingsCheckbox
                checked={settings.compression}
                onChange={checked =>
                  onSettingsChange({
                    ...settings,
                    compression: checked
                  })
                }
              >
                <p className={checkboxStyles.checkboxTextwrapper}>Enable Image Compression (Lossy)</p>
              </SettingsCheckbox>
              <SettingsSlider
                label="Quality:"
                min={1}
                max={100}
                value={settings.quality}
                onChange={val =>
                  onSettingsChange({
                    ...settings,
                    quality: val
                  })
                }
                disabled={!settings.compression}
                valueDisplay={`${settings.quality}%`}
              />
            </>
          )}
        </div>
        {renderFormatSpecificSettings()}
        <div className={styles.settingsButtons}>
          <button
            className={styles.applyButton}
            onClick={onApply}
          ><span>
            Apply
          </span>
              <svg viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                  fillRule="evenodd"
                ></path>
              </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageSettingsModal;
