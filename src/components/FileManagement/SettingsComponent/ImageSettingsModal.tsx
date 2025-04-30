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
  onApplyAll: () => void;
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
  onApply,
  onApplyAll
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
                <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <span>
            <svg viewBox="-2.84 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000" className={styles.gearIcon}>
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <defs>
                  <style>
                    {`.cls-1{fill:none;stroke:var(--text-color);stroke-linecap:round;stroke-linejoin:round;stroke-width:20px;}`}
                  </style>
                </defs>
                <g data-name="Layer 2" id="Layer_2">
                  <g data-name="E404, gear, Media, media player, multimedia" id="E404_gear_Media_media_player_multimedia">
                    <path
                      className="cls-1"
                      d="M373.59,340.89V299.52a18.84,18.84,0,0,0-18.84-18.84H333.48A18.92,18.92,0,0,1,316,268.91l-.1-.24a19,19,0,0,1,4-20.71l15-15a18.83,18.83,0,0,0,0-26.64L305.72,177a18.83,18.83,0,0,0-26.64,0l-15,15a19,19,0,0,1-20.71,4l-.24-.1a18.92,18.92,0,0,1-11.77-17.46V157.25a18.84,18.84,0,0,0-18.84-18.84H171.11a18.84,18.84,0,0,0-18.84,18.84v21.27A18.92,18.92,0,0,1,140.5,196l-.24.1a19,19,0,0,1-20.71-4l-15-15a18.83,18.83,0,0,0-26.64,0L48.62,206.28a18.83,18.83,0,0,0,0,26.64l15,15a19,19,0,0,1,4,20.71l-.1.24a18.92,18.92,0,0,1-17.46,11.77H28.84A18.84,18.84,0,0,0,10,299.52v41.37a18.84,18.84,0,0,0,18.84,18.84H50.11A18.92,18.92,0,0,1,67.57,371.5l.1.24a19,19,0,0,1-4,20.71l-15,15a18.83,18.83,0,0,0,0,26.64l29.25,29.25a18.83,18.83,0,0,0,26.64,0l15-15a19,19,0,0,1,20.71-4l.24.1a18.92,18.92,0,0,1,11.77,17.46v21.27A18.84,18.84,0,0,0,171.11,502h41.37a18.84,18.84,0,0,0,18.84-18.84V461.89a18.92,18.92,0,0,1,11.77-17.46l.24-.1a19,19,0,0,1,20.71,4l15,15a18.83,18.83,0,0,0,26.64,0L335,434.13a18.83,18.83,0,0,0,0-26.64l-15-15a19,19,0,0,1-4-20.71l.1-.24a18.92,18.92,0,0,1,17.46-11.77h21.27A18.84,18.84,0,0,0,373.59,340.89Z"
                    ></path>
                    <circle className="cls-1" cx="191.8" cy="320.2" r="74.8"></circle>
                    <path
                      className="cls-1"
                      d="M207.45,138.41V138a15,15,0,0,1,15-15h16.9a15,15,0,0,0,13.88-9.35c0-.06.05-.13.08-.19A15.06,15.06,0,0,0,250.09,97l-12-11.94a15,15,0,0,1,0-21.17l23.24-23.24a15,15,0,0,1,21.16,0l11.95,12a15.07,15.07,0,0,0,16.45,3.18l.19-.08a15,15,0,0,0,9.36-13.88V25a15,15,0,0,1,15-15h32.87a15,15,0,0,1,15,15v16.9a15,15,0,0,0,9.35,13.88l.18.08a15.09,15.09,0,0,0,16.46-3.18l12-12a15,15,0,0,1,21.16,0l23.24,23.24a15,15,0,0,1,0,21.17L453.68,97a15.05,15.05,0,0,0-3.17,16.46l.07.19A15,15,0,0,0,464.45,123h16.9a15,15,0,0,1,15,15v32.86a15,15,0,0,1-15,15h-16.9a15,15,0,0,0-13.87,9.36l-.07.18a15,15,0,0,0,3.17,16.46l11.95,11.95a15,15,0,0,1,0,21.16l-23.24,23.24a15,15,0,0,1-21.16,0l-12-11.95a15,15,0,0,0-16.46-3.18l-.18.07A15,15,0,0,0,383.29,267v16.9a15,15,0,0,1-9.77,14"
                    ></path>
                    <circle className="cls-1" cx="351.88" cy="154.43" r="48.69"></circle>
                  </g>
                </g>
              </g>
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
            className={`${styles.applyButton} ${styles.applyAllButton}`}
            onClick={onApplyAll}
          >
            <span>Apply to All {selectedFormat.toUpperCase()}</span>
          </button>

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
