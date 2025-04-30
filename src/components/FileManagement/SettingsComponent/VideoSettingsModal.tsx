import React, { useEffect } from 'react';
import styles from './settings.module.css';
import checkboxStyles from '../checkbox.module.css';
import dropdownStyles from '../dropdown.module.css';
import SettingsCheckbox from '../SettingsCheckbox';
import SettingsSlider from '../SettingsSlider';
import DropDown from '../DropDown';

// --- Video FileSettings interface for backend compatibility ---
export interface FileSettings {
  removeMetadata: boolean;
  codec: string;
  fps: number | null;
  formatSpecific: {
    mp4: {
      profile: string;
      level: number;
      crf: number;
      speed: string;
      bitrate: number;
    };
    webm: {
      speed: string;
      bitrate: number;
    };
    mkv: {
      profile: string;
      level: number;
      crf: number;
      speed: string;
      bitrate: number;
    };
    mov: {
      profile: string;
      level: number;
      crf: number;
      speed: string;
      bitrate: number;
    };
    ts: {
      profile: string;
      level: number;
      crf: number;
      speed: string;
      bitrate: number;
    };
    mts: {
      profile: string;
      level: number;
      crf: number;
      speed: string;
      bitrate: number;
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

interface GenericDropdownProps {
  label: string;
  options: Array<{
    value: string | number | null;
    label: string;
  }>;
  value: string | number | null;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onChange: (value: string | number | null) => void;
}

// --- Helper data ---
const SUPPORTED_CODECS: Record<string, string[]> = {
  mp4: ['libx264', 'libx265', 'libaom-av1'],
  webm: ['libvpx', 'libvpx-vp9'],
  mkv: ['libx264', 'libx265', 'libaom-av1'],
  mov: ['libx264', 'libx265'],
  avi: ['mpeg4'],
  wmv: ['wmv2'],
  flv: ['flv', 'libx264', 'libx265'],
  ts: ['libx264', 'libx265'],
  mts: ['libx264', 'libx265'],
};
const PROFILES: Record<string, string[]> = {
  libx264: ['baseline', 'main', 'high'],
  libx265: ['main'],
};
const LEVELS: Record<string, number[]> = {
  libx264: [3.0, 3.1, 4.0, 4.1, 4.2, 5.0, 5.1, 5.2, 6.0],
  libx265: [3.0, 4.0, 4.1, 5.0, 5.1, 5.2, 6.0],
};
const SPEED_PRESETS: Record<string, string[]> = {
  libx264: ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'],
  libx265: ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'],
  'libaom-av1': ['good', 'best', 'realtime'],
  libvpx: ['good', 'best', 'realtime'],
};
const CRF_RANGES: Record<string, { min: number; max: number; default: number }> = {
  libx264: { min: 0, max: 51, default: 23 },
  libx265: { min: 0, max: 51, default: 28 },
  'libaom-av1': { min: 0, max: 63, default: 32 },
};

const CODEC_DEFAULTS = {
  'libx264': {
    profiles: PROFILES['libx264'] || ['main'],
    levels: LEVELS['libx264'] || ['4.0'],
    speeds: SPEED_PRESETS['libx264'] || ['medium'],
    crfRange: CRF_RANGES['libx264'] || { min: 0, max: 51, default: 23 }
  },
  'libx265': {
    profiles: PROFILES['libx265'] || ['main'],
    levels: LEVELS['libx265'] || ['4.0'],
    speeds: SPEED_PRESETS['libx265'] || ['medium'],
    crfRange: CRF_RANGES['libx265'] || { min: 0, max: 51, default: 28 }
  },
  'libaom-av1': {
    profiles: [],
    levels: [],
    speeds: SPEED_PRESETS['libaom-av1'] || ['good'],
    crfRange: CRF_RANGES['libaom-av1'] || { min: 0, max: 63, default: 32 }
  },
  'libvpx': {
    profiles: [],
    levels: [],
    speeds: SPEED_PRESETS['libvpx'] || ['good'],
    crfRange: { min: 4, max: 63, default: 10 }
  },
  'wmv2': {
    profiles: [],
    levels: [],
    speeds: [],
    crfRange: { min: 0, max: 31, default: 23 }
  },
  'mpeg4': {
    profiles: [],
    levels: [],
    speeds: [],
    crfRange: { min: 1, max: 31, default: 23 }
  },
  'flv': {
    profiles: [],
    levels: [],
    speeds: [],
    crfRange: { min: 1, max: 31, default: 23 }
  }
};

// Updated bitrate range to 1-20 (representing Mbps directly)
const BITRATE_MIN = 1;
const BITRATE_MAX = 20;
const BITRATE_STEP = 1;

const FPS_OPTIONS = [null, 24, 25, 30, 48, 50, 60];

type VideoFormat = 'mp4' | 'webm' | 'mkv' | 'mov' | 'ts' | 'mts';

// Add default bitrate to ensure we always have a value
type FormatSettings = {
  profile?: string;
  level?: number;
  crf?: number;
  speed?: string;
  bitrate: number;
};

interface CrfRange {
  min: number;
  max: number;
  default: number;
}

// Type guard functions
const hasProfile = (format: VideoFormat): boolean => {
  return ['mp4', 'mkv', 'mov', 'ts', 'mts'].includes(format);
};

const hasCrf = (format: VideoFormat): boolean => {
  return ['mp4', 'mkv', 'mov', 'ts', 'mts'].includes(format);
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  fileName,
  fileSize,
  settings,
  selectedFormat,
  onSettingsChange,
  onApply,
  onApplyAll
}) => {
  // Move state declarations before the conditional return
  const [codecOpen, setCodecOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [levelOpen, setLevelOpen] = React.useState(false);
  const [speedOpen, setSpeedOpen] = React.useState(false);
  const [fpsOpen, setFpsOpen] = React.useState(false);
  const dropdownRefs = {
    codec: React.useRef<HTMLDivElement>(null),
    profile: React.useRef<HTMLDivElement>(null),
    level: React.useRef<HTMLDivElement>(null),
    speed: React.useRef<HTMLDivElement>(null),
    fps: React.useRef<HTMLDivElement>(null)
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      
      if (dropdownRefs.codec.current && !dropdownRefs.codec.current.contains(target)) setCodecOpen(false);
      if (dropdownRefs.profile.current && !dropdownRefs.profile.current.contains(target)) setProfileOpen(false);
      if (dropdownRefs.level.current && !dropdownRefs.level.current.contains(target)) setLevelOpen(false);
      if (dropdownRefs.speed.current && !dropdownRefs.speed.current.contains(target)) setSpeedOpen(false);
      if (dropdownRefs.fps.current && !dropdownRefs.fps.current.contains(target)) setFpsOpen(false);
    }
    
    if (codecOpen || profileOpen || levelOpen || speedOpen || fpsOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => { document.removeEventListener('mousedown', handleClick); };
  }, [codecOpen, profileOpen, levelOpen, speedOpen, fpsOpen, dropdownRefs.codec, dropdownRefs.profile, dropdownRefs.level, dropdownRefs.speed, dropdownRefs.fps]);

  // Ensure default codec is set when switching formats (like AudioSettingsModal)
  useEffect(() => {
    const format = selectedFormat.toLowerCase();
    const codecs = SUPPORTED_CODECS[format] || [];
    if (codecs.length > 0 && (!settings.codec || !codecs.includes(settings.codec))) {
      onSettingsChange({ ...settings, codec: codecs[0] });
    }
  }, [selectedFormat, settings, onSettingsChange]);

  if (!isVisible) return null;

  const format = selectedFormat.toLowerCase();
  const codecs = SUPPORTED_CODECS[format] || [];
  const codec = settings.codec && codecs.includes(settings.codec) ? settings.codec : codecs[0] || '';
  const profiles = PROFILES[codec] || [];
  const levels = LEVELS[codec] || [];
  const speedPresets = SPEED_PRESETS[codec] || [];

  const formatFileSize = (size?: number): string => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Modified renderBitrateSlider function to handle 0 values explicitly
  const renderBitrateSlider = (format: VideoFormat, fs: FormatSettings) => {
    // Ensure we have a valid bitrate, with stronger fallback logic
    const currentBitrate = fs.bitrate ? fs.bitrate : 8
    
    return (
      <SettingsSlider
        label="Bitrate:"
        min={BITRATE_MIN}
        max={BITRATE_MAX}
        step={BITRATE_STEP}
        value={currentBitrate}
        onChange={val =>
          onSettingsChange({
            ...settings,
            formatSpecific: {
              ...settings.formatSpecific,
              [format]: { ...fs, bitrate: val }
            }
          })
        }
        valueDisplay={`${currentBitrate}M`}
      />
    );
  };

  const renderCrfSlider = (format: VideoFormat, fs: FormatSettings, crfRange: CrfRange) => (
    <SettingsSlider
      label="CRF (Quality):"
      min={crfRange.min}
      max={crfRange.max}
      value={'crf' in fs && fs.crf !== undefined ? fs.crf : crfRange.default}
      onChange={val =>
        onSettingsChange({
          ...settings,
          formatSpecific: {
            ...settings.formatSpecific,
            [format]: { ...fs, crf: val }
          }
        })
      }
      valueDisplay={'crf' in fs ? fs.crf : crfRange.default}
    />
  );

  const renderGenericDropdown = ({
    label,
    options,
    value,
    open,
    setOpen,
    dropdownRef,
    onChange
  }: GenericDropdownProps) => (
    <DropDown
      label={label}
      open={open}
      setOpen={setOpen}
      dropdownRef={dropdownRef as React.RefObject<HTMLDivElement>}
      containerClassName={dropdownStyles.dropdownContainer}
      labelClassName={dropdownStyles.dropdownLabel}
      dropdownClassName={dropdownStyles.customDropdown + (open ? ' ' + dropdownStyles.open : '')}
      menuClassName={dropdownStyles.customDropdownMenu}
      trigger={
        <button
          type="button"
          className={dropdownStyles.customDropdownTrigger}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          {value}
          <span className={dropdownStyles.customDropdownArrow + (open ? ' ' + dropdownStyles.open : '')}>
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      }
    >
      {options.map(option => (
        <button
          type="button"
          key={option.value}
          className={`${dropdownStyles.customDropdownOption}${option.value === value ? ' ' + dropdownStyles.selected : ''}`}
          tabIndex={open ? 0 : -1}
          onClick={() => {
            onChange(option.value);
            setOpen(false);
          }}
        >
          {option.label}
        </button>
      ))}
    </DropDown>
  );

  const renderFPSDropdown = () => {
    const fpsOptions = FPS_OPTIONS.map(fps => ({
      value: fps,
      label: fps === null ? 'Auto' : `${fps} fps`
    }));
    
    return renderGenericDropdown({
      label: "Frame Rate:",
      options: fpsOptions,
      value: settings.fps === null ? 'Auto' : `${settings.fps} fps`,
      open: fpsOpen,
      setOpen: setFpsOpen,
      dropdownRef: dropdownRefs.fps,
      onChange: (value) => {
        // Fix type conversion
        const newValue = value === null ? null : 
                        typeof value === 'number' ? value : 
                        parseInt(String(value)) || null;
        onSettingsChange({ ...settings, fps: newValue });
      }
    });
  };

  const renderCodecDropdown = () => {
    const codecOptions = codecs.map(c => ({
      value: c,
      label: c
    }));
    
    return renderGenericDropdown({
      label: "Codec:",
      options: codecOptions,
      value: settings.codec || codecs[0],
      open: codecOpen, 
      setOpen: setCodecOpen,
      dropdownRef: dropdownRefs.codec,
      onChange: (value) => {
        // Ensure codec is always a string
        const newCodec = value !== null ? String(value) : codecs[0] || '';
        onSettingsChange({ ...settings, codec: newCodec });
      }
    });
  };
  
  const renderProfileDropdown = () => {
    if (!profiles.length) return null;
    
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    const profileOptions = profiles.map(p => ({
      value: p,
      label: p.charAt(0).toUpperCase() + p.slice(1)
    }));
    
    return renderGenericDropdown({
      label: "Profile:",
      options: profileOptions,
      value: fs && 'profile' in fs ? fs.profile : profiles[0],
      open: profileOpen,
      setOpen: setProfileOpen,
      dropdownRef: dropdownRefs.profile,
      onChange: (value) => {
        onSettingsChange({
          ...settings,
          formatSpecific: {
            ...settings.formatSpecific,
            [format as keyof typeof settings.formatSpecific]: { 
              ...fs, 
              profile: value 
            }
          }
        });
      }
    });
  };
  
  const renderSpeedDropdown = () => {
    if (!speedPresets.length) return null;
    
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    const speedOptions = speedPresets.map(s => ({
      value: s,
      label: s.charAt(0).toUpperCase() + s.slice(1)
    }));
    
    return renderGenericDropdown({
      label: "Speed:",
      options: speedOptions,
      value: fs && 'speed' in fs ? fs.speed : speedPresets[0],
      open: speedOpen,
      setOpen: setSpeedOpen,
      dropdownRef: dropdownRefs.speed,
      onChange: (value) => {
        onSettingsChange({
          ...settings,
          formatSpecific: {
            ...settings.formatSpecific,
            [format as keyof typeof settings.formatSpecific]: { 
              ...fs, 
              speed: value 
            }
          }
        });
      }
    });
  };

  // --- Level slider for codecs with levels ---
  const renderLevelSlider = () => {
    if (!levels.length) return null;
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    // Find the closest level to the current value
    const currentLevel = (fs && 'level' in fs && typeof fs.level === 'number')
      ? fs.level
      : levels[0] || 4.0; // Add fallback value
    return (
      <SettingsSlider
        label="Level:"
        min={min}
        max={max}
        step={0.1}
        value={currentLevel}
        onChange={val => {
          // Find the closest number level
          const closest = levels.reduce((prev, curr) =>
            Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
          );
          onSettingsChange({
            ...settings,
            formatSpecific: {
              ...settings.formatSpecific,
              [format as keyof typeof settings.formatSpecific]: { ...fs, level: closest }
            }
          });
        }}
        valueDisplay={currentLevel}
      />
    );
  };

  // --- Format-specific settings ---
  const renderFormatSpecificSettings = () => {
    const format = selectedFormat.toLowerCase() as VideoFormat;
    
    // Early return if not a supported format
    if (!['mp4', 'webm', 'mkv', 'mov', 'ts', 'mts'].includes(format)) {
      return null;
    }
    
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    const codec = settings.codec;
    const codecDefaults = codec ? CODEC_DEFAULTS[codec as keyof typeof CODEC_DEFAULTS] : null;
    
    return (
      <div className={styles.formatSpecificSettings}>
        <h4>{format.toUpperCase()} Specific Settings</h4>
        
        {/* Profile dropdown - only for formats that support profiles */}
        {hasProfile(format) && codecDefaults?.profiles && renderProfileDropdown()}
        
        {/* Level slider - only for formats that support levels */}
        {hasProfile(format) && LEVELS[codec] && renderLevelSlider()}
        
        {/* Speed dropdown - all formats have this */}
        {renderSpeedDropdown()}
        
        {/* CRF slider - only for formats that support CRF */}
        {hasCrf(format) && codecDefaults?.crfRange && 
          renderCrfSlider(format, fs, codecDefaults.crfRange)}
        
        {/* Bitrate slider - all formats have this */}
        {renderBitrateSlider(format, fs)}
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
            Video Settings
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
          {/* FPS */}
          {renderFPSDropdown()}
          {/* Codec */}
          {renderCodecDropdown()}
        </div>
        {/* Format-specific settings */}
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

export default SettingsModal;
