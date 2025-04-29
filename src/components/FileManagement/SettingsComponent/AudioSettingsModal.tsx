import React, { useEffect } from 'react';
import styles from './settings.module.css';
import checkboxStyles from '../checkbox.module.css';
import radioStyles from '../radio.module.css';
import dropdownStyles from '../dropdown.module.css';
import SettingsCheckbox from '../SettingsCheckbox';
import SettingsSlider from '../SettingsSlider';
import DropDown from '../DropDown';

// --- Audio FileSettings interface for backend compatibility ---
export interface FileSettings {
  removeMetadata: boolean;
  channels: number;
  sampleRate: number;
  codec: string; 
  formatSpecific: {
    mp3: {
      bitrate: string;
      compressionLevel: number;
    };
    ogg: {
      bitrate: string;
      compressionLevel: number;
    };
    opus: {
      bitrate: string;
      compressionLevel: number;
    };
    aac: {
      bitrate: string;
    };
    m4a: {
      bitrate: string;
    };
    flac: {
      compressionLevel: number;
    };
    wma: {
      bitrate: string;
    };
    amr: {
      bitrate: string;
    };
    ac3: {
      bitrate: string;
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

// --- Helper data ---
const SUPPORTED_CODECS: Record<string, string[]> = {
  mp3: ['libmp3lame'],
  ogg: ['libvorbis', 'libopus'],
  opus: ['libopus'],
  aac: ['aac', 'libfdk_aac'],
  m4a: ['aac', 'libfdk_aac'],
  flac: ['flac'],
  alac: ['alac'],
  wav: ['pcm_s16le', 'pcm_s24le', 'pcm_s32le'],
  aiff: ['pcm_s16le', 'pcm_s24le', 'pcm_s32le'],
  wma: ['wmav2'],
  amr: ['libopencore_amrnb'],
  ac3: ['ac3'],
};
const CODECS_WITH_COMPRESSION_LEVEL = ['flac', 'libmp3lame', 'libopus'];
const SAMPLE_RATES = [8000, 16000, 22050, 32000, 44100, 48000, 96000];
const BITRATE_MIN = 64;
const BITRATE_MAX = 320;
const BITRATE_STEP = 8;
type AudioFormat = 'mp3' | 'ogg' | 'opus' | 'aac' | 'm4a' | 'flac' | 'wma' | 'amr' | 'ac3';

// Helper types to narrow down format properties
type FormatWithBitrate = Extract<AudioFormat, 'mp3' | 'ogg' | 'opus' | 'aac' | 'm4a' | 'wma' | 'amr' | 'ac3'>;
type FormatWithCompression = Extract<AudioFormat, 'mp3' | 'ogg' | 'opus' | 'flac'>;
// Type guard functions
const hasBitrate = (format: AudioFormat): format is FormatWithBitrate => {
  return ['mp3', 'ogg', 'opus', 'aac', 'm4a', 'wma', 'amr', 'ac3'].includes(format);
};

const hasCompression = (format: AudioFormat): format is FormatWithCompression => {
  return ['mp3', 'ogg', 'opus', 'flac'].includes(format);
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  fileName,
  fileSize,
  settings,
  selectedFormat,
  onSettingsChange,
  onApply
}) => {
  // Move state declarations here, before the conditional return
  const [sampleRateOpen, setSampleRateOpen] = React.useState(false);
  const [codecOpen, setCodecOpen] = React.useState(false);
  const sampleRateDropdownRef = React.useRef<HTMLDivElement>(null);
  const codecDropdownRef = React.useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        sampleRateDropdownRef.current &&
        !sampleRateDropdownRef.current.contains(e.target as Node)
      ) setSampleRateOpen(false);
      if (
        codecDropdownRef.current &&
        !codecDropdownRef.current.contains(e.target as Node)
      ) setCodecOpen(false);
    }
    if (sampleRateOpen || codecOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => { document.removeEventListener('mousedown', handleClick); };
  }, [sampleRateOpen, codecOpen]);

  // Ensure default codec is set when switching formats
  useEffect(() => {
    const format = selectedFormat.toLowerCase();
    const codecs = SUPPORTED_CODECS[format] || [];
    if (codecs.length > 0 && (!settings.codec || !codecs.includes(settings.codec))) {
      onSettingsChange({ ...settings, codec: codecs[0] });
    }
  }, [selectedFormat, settings, onSettingsChange]);

  if (!isVisible) return null;

  const formatFileSize = (size?: number): string => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Helper to render bitrate slider for supported formats 
  const renderBitrateSlider = (format: AudioFormat) => {
    if (!hasBitrate(format)) return null;

    const fs = settings.formatSpecific[format] || {};
    
    return (
      <SettingsSlider
        label="Bitrate:"
        min={BITRATE_MIN}
        max={BITRATE_MAX}
        step={BITRATE_STEP}
        value={fs.bitrate ? parseInt(fs.bitrate) : 192}
        onChange={val =>
          onSettingsChange({
            ...settings,
            formatSpecific: {
              ...settings.formatSpecific,
              [format]: {
                ...fs,
                bitrate: `${val}k`
              }
            }
          })
        }
        valueDisplay={fs.bitrate ?? "192k"}
      />
    );
  };

  const renderCompressionLevelSlider = (format: AudioFormat, min: number = 0, max: number = 10) => {
    if (!hasCompression(format)) return null;

    const fs = settings.formatSpecific[format] || {};
    const defaultLevel = format === 'flac' ? 5 : format === 'mp3' ? 6 : 10;
    
    return (
      <SettingsSlider
        label="Compression Level:"
        min={min}
        max={max}
        value={fs.compressionLevel ?? defaultLevel}
        onChange={val =>
          onSettingsChange({
            ...settings,
            formatSpecific: {
              ...settings.formatSpecific,
              [format]: {
                ...fs,
                compressionLevel: val
              }
            }
          })
        }
        valueDisplay={fs.compressionLevel ?? defaultLevel}
      />
    );
  };

  // --- Custom Dropdown for Sample Rate using DropDown ---
  const renderSampleRateDropdown = () => (
    <DropDown
      label="Sample Rate:"
      open={sampleRateOpen}
      setOpen={setSampleRateOpen}
      dropdownRef={sampleRateDropdownRef as React.RefObject<HTMLDivElement>}
      containerClassName={dropdownStyles.dropdownContainer}
      labelClassName={dropdownStyles.dropdownLabel}
      dropdownClassName={dropdownStyles.customDropdown + (sampleRateOpen ? ' ' + dropdownStyles.open : '')}
      menuClassName={dropdownStyles.customDropdownMenu}
      trigger={
        <button
          type="button"
          className={dropdownStyles.customDropdownTrigger}
          onClick={() => setSampleRateOpen(o => !o)}
          aria-expanded={sampleRateOpen}
        >
          {settings.sampleRate
            ? `${settings.sampleRate} Hz`
            : 'Auto'}
          <span className={dropdownStyles.customDropdownArrow + (sampleRateOpen ? ' ' + dropdownStyles.open : '')}>
            {/* SVG arrow */}
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      }
    >
      <button
        type="button"
        className={`${dropdownStyles.customDropdownOption}${!settings.sampleRate ? ' ' + dropdownStyles.selected : ''}`}
        tabIndex={sampleRateOpen ? 0 : -1}
        onClick={() => {
          onSettingsChange({ ...settings});
          setSampleRateOpen(false);
        }}
      >
        Auto
      </button>
      {SAMPLE_RATES.map(sr => (
        <button
          type="button"
          key={sr}
          className={`${dropdownStyles.customDropdownOption}${settings.sampleRate === sr ? ' ' + dropdownStyles.selected : ''}`}
          tabIndex={sampleRateOpen ? 0 : -1}
          onClick={() => {
            onSettingsChange({ ...settings, sampleRate: sr });
            setSampleRateOpen(false);
          }}
        >
          {sr} Hz
        </button>
      ))}
    </DropDown>
  );

  // --- Custom Dropdown for Codec using DropDown ---
  const renderCodecDropdown = () => {
    const format = selectedFormat.toLowerCase();
    const codecs = SUPPORTED_CODECS[format] || [];
    if (codecs.length === 0) return null;
    return (
      <DropDown
        label="Codec:"
        open={codecOpen}
        setOpen={setCodecOpen}
        dropdownRef={codecDropdownRef as React.RefObject<HTMLDivElement>}
        containerClassName={dropdownStyles.dropdownContainer}
        labelClassName={dropdownStyles.dropdownLabel}
        dropdownClassName={dropdownStyles.customDropdown + (codecOpen ? ' ' + dropdownStyles.open : '')}
        menuClassName={dropdownStyles.customDropdownMenu}
        trigger={
          <button
            type="button"
            className={dropdownStyles.customDropdownTrigger}
            onClick={() => setCodecOpen(o => !o)}
            aria-expanded={codecOpen}
          >
            {settings.codec ?? codecs[0]}
            <span className={dropdownStyles.customDropdownArrow + (codecOpen ? ' ' + dropdownStyles.open : '')}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        }
      >
        {codecs.map(codec => (
          <button
            type="button"
            key={codec}
            className={`${dropdownStyles.customDropdownOption}${settings.codec === codec ? ' ' + dropdownStyles.selected : ''}`}
            tabIndex={codecOpen ? 0 : -1}
            onClick={() => {
              onSettingsChange({ ...settings, codec });
              setCodecOpen(false);
            }}
          >
            {codec}
          </button>
        ))}
      </DropDown>
    );
  };
  

  const renderFormatSpecificSettings = () => {
    // Convert to AudioFormat type
    const format = selectedFormat.toLowerCase() as AudioFormat;
    
    // Check if this is a valid audio format
    if (!['mp3', 'ogg', 'opus', 'aac', 'm4a', 'flac', 'wma', 'amr', 'ac3'].includes(format)) {
      return null;
    }
    
    return (
      <div className={styles.formatSpecificSettings}>
        {/* Only show title for non-FLAC formats */}
        {format !== 'flac' && <h4>{format.toUpperCase()} Specific Settings</h4>}
        
        {/* Conditionally render bitrate slider only for formats that support it */}
        {hasBitrate(format) && renderBitrateSlider(format)}
        
        {/* Conditionally render compression slider only for formats that support it */}
        {hasCompression(format) && 
         settings.codec && 
         CODECS_WITH_COMPRESSION_LEVEL.includes(settings.codec) &&
         renderCompressionLevelSlider(
           format,
           format === 'mp3' ? 0 : 0,
           format === 'flac' ? 12 : format === 'mp3' ? 9 : 10
         )}
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
          Audio Settings
        </span>
        </h2>
        <h3 className={styles.settingsfileName}>
          {fileName} {fileSize && `(${formatFileSize(fileSize)})`}
        </h3>
        <div className={styles.settingOption}>
          {/* Remove Metadata */}
          <SettingsCheckbox
            checked={settings.removeMetadata}
            onChange={checked => onSettingsChange({ ...settings, removeMetadata: checked })}
          >
            <p className={checkboxStyles.checkboxTextwrapper}>Remove Metadata</p>
          </SettingsCheckbox>
          {/* Channels */}
          <div className={radioStyles.radioWrapper}>
            <label style={{ marginRight: '1rem' }}>Channels:</label>
            <div className={radioStyles.radioInput}>
              <label>
                <input
                  type="radio"
                  name="channels"
                  value="1"
                  checked={settings.channels === 1}
                  onChange={() => onSettingsChange({ ...settings, channels: 1 })}
                />
                <span>1</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="channels"
                  value="2"
                  checked={settings.channels === 2}
                  onChange={() => onSettingsChange({ ...settings, channels: 2 })}
                />
                <span>2</span>
              </label>
              <span className={radioStyles.selection} />
            </div>
          </div>
        </div>
        {/* Sample Rate */}
        {renderSampleRateDropdown()}
        {/* Universal Codec Select */}
        {renderCodecDropdown()}
        {/* Format-specific settings */}
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

export default SettingsModal;
