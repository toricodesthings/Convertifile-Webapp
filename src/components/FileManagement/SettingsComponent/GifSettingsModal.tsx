import React, { useRef, useEffect, useState } from 'react';
import styles from './settings.module.css';
import checkboxStyles from '../checkbox.module.css';
import SettingsCheckbox from '../SettingsCheckbox';
import SettingsSlider from '../SettingsSlider';

// --- GIF FileSettings interface for backend compatibility ---
export interface FileSettings {
  removeMetadata: boolean;
  quality: number;
  fps: number;
  width: number | null;
  height: number | null;
  maintainAspectRatio: boolean;
  loop: boolean;
  dither: boolean;
  startTime?: number;
  endTime?: number;
}

interface SettingsModalProps {
  isVisible: boolean;
  fileName: string;
  fileSize?: number;
  settings: FileSettings;
  onSettingsChange: (settings: FileSettings) => void;
  onApply: () => void;
  onApplyAll: () => void;
}

/**
 * GifSettingsModal component for configuring GIF conversion settings
 * 
 * @param props - Component props containing settings and handler functions
 * @returns React component
 */
const GifSettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  fileName,
  fileSize,
  settings,
  onSettingsChange,
  onApply,
  onApplyAll
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [tabIndex, setTabIndex] = useState(0);

  // Handle clicks outside the modal to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onApply();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onApply]);

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onApply();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onApply]);
  
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
  };  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsContainer} ref={modalRef}>
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
                      d="M373.59,340.89V299.52a18.84,18.84,0,0,0-18.84-18.84H333.48A18.92,18.92,0,0,1,316,268.91l-.1-.24a19,19,0,0,1,4-20.71l15-15a18.83,18.83,0,0,0,0-26.64L305.72,177a18.83,18.83,0,0,0-26.64,0l-15,15a19,19,0,0,1-20.71,4l-.24-.1a18.92,18.92,0,0,1-11.77-17.46V157.25a18.84,18.84,0,0,0-18.84-18.84H171.11a18.84,18.84,0,0,0-18.84,18.84v21.27a18.92,18.92,0,0,1-11.77,17.46l-.24.1a19,19,0,0,1-20.71-4l-15-15a18.83,18.83,0,0,0-26.64,0L48.64,206.37a18.83,18.83,0,0,0,0,26.64l15,15a19,19,0,0,1,4,20.71l-.1.24a18.92,18.92,0,0,1-17.46,11.77H28.84A18.84,18.84,0,0,0,10,299.52v41.37a18.84,18.84,0,0,0,18.84,18.84H50.11a18.92,18.92,0,0,1,17.46,11.77l.1.24a19,19,0,0,1-4,20.71l-15,15a18.83,18.83,0,0,0,0,26.64L77.91,463.36a18.83,18.83,0,0,0,26.64,0l15-15a19,19,0,0,1,20.71-4l.24.1a18.92,18.92,0,0,1,11.77,17.46v21.27a18.84,18.84,0,0,0,18.84,18.84H212.52a18.84,18.84,0,0,0,18.84-18.84V461.92a18.92,18.92,0,0,1,11.77-17.46l.24-.1a19,19,0,0,1,20.71,4l15,15a18.83,18.83,0,0,0,26.64,0L335,434.09a18.83,18.83,0,0,0,0-26.64l-15-15a19,19,0,0,1-4-20.71l.1-.24a18.92,18.92,0,0,1,17.46-11.77h21.27A18.84,18.84,0,0,0,373.59,340.89Z"
                    ></path>
                    <circle className="cls-1" cx="191.8" cy="320.2" r="74.8"></circle>
                    <path
                      className="cls-1"
                      d="M207.45,138.41V138a15,15,0,0,1,15-15h16.9a15,15,0,0,0,13.88-9.35c0-.06.05-.13.08-.19A15.06,15.06,0,0,0,250.09,97l-12-11.94a15,15,0,0,1,0-21.17l23.24-23.24a15,15,0,0,1,21.16,0l11.95,12a15.07,15.07,0,0,0,16.45,3.18l.19-.08a15,15,0,0,0,9.36-13.88V25a15,15,0,0,1,15-15h32.87a15,15,0,0,1,15,15v16.9a15,15,0,0,0,9.36,13.88l.19.08a15.06,15.06,0,0,0,16.45-3.18l11.95-12a15,15,0,0,1,21.16,0L465.09,63.9a15,15,0,0,1,0,21.17l-12,11.94a15.07,15.07,0,0,0-3.18,16.45l.08.19a15,15,0,0,0,13.88,9.35H481a15,15,0,0,1,15,15v32.87a15,15,0,0,1-15,15H464.1a15,15,0,0,0-13.88,9.36l-.08.19a15.06,15.06,0,0,0,3.18,16.45l12,11.95a15,15,0,0,1,0,21.16L442.09,268.28a15,15,0,0,1-21.16,0l-11.95-12a15.07,15.07,0,0,0-16.45-3.18l-.19.08a15,15,0,0,0-9.36,13.88V284a15,15,0,0,1-15,15H335.11a15,15,0,0,1-15-15V267.1a15,15,0,0,0-9.36-13.88l-.19-.08a15.06,15.06,0,0,0-16.45,3.18l-11.95,12a15,15,0,0,1-21.16,0L237.76,245.09a15,15,0,0,1,0-21.16l12-11.95a15.07,15.07,0,0,0,3.18-16.45l-.08-.19a15,15,0,0,0-13.88-9.36H222.1a15,15,0,0,1-15-15V138A15,15,0,0,1,222.1,123h16.9a15,15,0,0,0,13.88-9.36l.08-.19a15.06,15.06,0,0,0-3.18-16.45l-12-11.95a15,15,0,0,1,0-21.16L261,40.66a15,15,0,0,1,21.16,0l11.95,12a15.07,15.07,0,0,0,16.45,3.18l.19-.08A15,15,0,0,0,320.11,42V25a15,15,0,0,1,15-15h32.87a15,15,0,0,1,15,15V42a15,15,0,0,0,9.36,13.88l.19.08a15.06,15.06,0,0,0,16.45-3.18l11.95-12a15,15,0,0,1,21.16,0L465.33,63.9a15,15,0,0,1,0,21.16l-12,11.95a15.07,15.07,0,0,0-3.18,16.45l.08.19A15,15,0,0,0,464.1,123H481a15,15,0,0,1,15,15Z"
                    ></path>
                    <circle className="cls-1" cx="351.88" cy="154.43" r="48.69"></circle>
                  </g>
                </g>
              </g>
            </svg>
            GIF Settings
          </span>
        </h2>
        <h3 className={styles.settingsfileName}>
          {fileName} {fileSize && fileSize > 0 ? `(${formatFileSize(fileSize)})` : ''}
        </h3>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tabIndex === 0 ? styles.activeTab : ''}`}
            onClick={() => setTabIndex(0)}
          >
            Basic Settings
          </button>
          <button
            className={`${styles.tab} ${tabIndex === 1 ? styles.activeTab : ''}`}
            onClick={() => setTabIndex(1)}
          >
            Size Settings
          </button>
          <button
            className={`${styles.tab} ${tabIndex === 2 ? styles.activeTab : ''}`}
            onClick={() => setTabIndex(2)}
          >
            GIF Options
          </button>
        </div>

        <div className={styles.tabContent}>
          {tabIndex === 0 && (
            <div className={styles.settingsPanel}>
              <div className={styles.settingsRow}>
                <SettingsCheckbox
                  checked={settings.removeMetadata}
                  onChange={checked =>
                    onSettingsChange({
                      ...settings,
                      removeMetadata: checked
                    })
                  }
                >
                  <p className={checkboxStyles.checkboxTextwrapper}>Remove Metadata</p>
                </SettingsCheckbox>
              </div>              <div className={styles.settingsRow}>
                <h3 className={styles.settingGroupTitle}>GIF Quality</h3>
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
                  valueDisplay={`${settings.quality}%`}
                />
              </div>              <div className={styles.settingsRow}>
                <SettingsSlider
                  label="FPS:"
                  min={5}
                  max={30}
                  value={settings.fps}
                  onChange={val =>
                    onSettingsChange({
                      ...settings,
                      fps: val
                    })
                  }
                  valueDisplay={`${settings.fps}`}
                />
              </div>
            </div>
          )}

          {tabIndex === 1 && (
            <div className={styles.settingsPanel}>
              <div className={styles.settingsRow}>
                <SettingsCheckbox
                  checked={settings.maintainAspectRatio}
                  onChange={checked =>
                    onSettingsChange({
                      ...settings,
                      maintainAspectRatio: checked
                    })
                  }
                >
                  <p className={checkboxStyles.checkboxTextwrapper}>Maintain Aspect Ratio</p>
                </SettingsCheckbox>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.dimensionInputs}>
                  <div>
                    <label>Width:</label>
                    <input
                      type="number"
                      value={settings.width || ''}
                      onChange={e => {
                        const newWidth = e.target.value ? parseInt(e.target.value) : null;
                        onSettingsChange({
                          ...settings,
                          width: newWidth
                        });
                      }}
                      placeholder="Auto"
                      className={styles.dimensionInput}
                    />
                  </div>
                  <div>
                    <label>Height:</label>
                    <input
                      type="number"
                      value={settings.height || ''}
                      onChange={e => {
                        const newHeight = e.target.value ? parseInt(e.target.value) : null;
                        onSettingsChange({
                          ...settings,
                          height: newHeight
                        });
                      }}
                      placeholder="Auto"
                      className={styles.dimensionInput}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tabIndex === 2 && (
            <div className={styles.settingsPanel}>
              <div className={styles.settingsRow}>
                <SettingsCheckbox
                  checked={settings.loop}
                  onChange={checked =>
                    onSettingsChange({
                      ...settings,
                      loop: checked
                    })
                  }
                >
                  <p className={checkboxStyles.checkboxTextwrapper}>Loop GIF</p>
                </SettingsCheckbox>
                <p className={styles.settingDescription}>
                  Enabling looping makes the GIF play continuously
                </p>
              </div>

              <div className={styles.settingsRow}>
                <SettingsCheckbox
                  checked={settings.dither}
                  onChange={checked =>
                    onSettingsChange({
                      ...settings,
                      dither: checked
                    })
                  }
                >
                  <p className={checkboxStyles.checkboxTextwrapper}>Enable Dithering</p>
                </SettingsCheckbox>
                <p className={styles.settingDescription}>
                  Dithering helps smooth color transitions and can improve GIF quality
                </p>
              </div>
            </div>
          )}        </div>          <div className={styles.settingsFooter}>
          <button
            className={styles.applyButton}
            onClick={onApply}
          >
            <span>Apply</span>
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

export default GifSettingsModal;
