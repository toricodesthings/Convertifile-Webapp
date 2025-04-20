import React, { useEffect } from 'react';
import styles from './settings.module.css';
import checkboxStyles from '../checkbox.module.css';
import dropdownStyles from '../dropdown.module.css';
import sliderStyles from '../slider.module.css';

// --- Video FileSettings interface for backend compatibility ---
export interface FileSettings {
  removeMetadata: boolean;
  codec: string;
  fps: number | null;
  formatSpecific: {
    mp4: {
      profile: string;
      level: string;
      crf: number;
      speed: string;
      bitrate: string;
    };
    webm: {
      speed: string;
      bitrate: string;
    };
    mkv: {
      profile: string;
      level: string;
      crf: number;
      speed: string;
      bitrate: string;
    };
    mov: {
      profile: string;
      level: string;
      crf: number;
      speed: string;
      bitrate: string;
    };
    ts: {
      profile: string;
      level: string;
      crf: number;
      speed: string;
      bitrate: string;
    };
    mts: {
      profile: string;
      level: string;
      crf: number;
      speed: string;
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
  mp4: ['libx264', 'libx265', 'libaom-av1'],
  webm: ['libvpx'],
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
const LEVELS: Record<string, string[]> = {
  libx264: ['3.0', '3.1', '4.0', '4.1', '4.2', '5.0', '5.1', '5.2', '6.0'],
  libx265: ['3.0', '4.0', '4.1', '5.0', '5.1', '5.2', '6.0'],
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

const BITRATE_MIN = 1000;
const BITRATE_MAX = 40000;
const BITRATE_STEP = 100;

const FPS_OPTIONS = [null, 24, 25, 30, 48, 50, 60];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  fileName,
  fileSize,
  settings,
  selectedFormat,
  onSettingsChange,
  onApply
}) => {
  // Move state declarations before the conditional return
  const [codecOpen, setCodecOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [levelOpen, setLevelOpen] = React.useState(false);
  const [speedOpen, setSpeedOpen] = React.useState(false);
  const [fpsOpen, setFpsOpen] = React.useState(false);
  const codecDropdownRef = React.useRef<HTMLDivElement>(null);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  const levelDropdownRef = React.useRef<HTMLDivElement>(null);
  const speedDropdownRef = React.useRef<HTMLDivElement>(null);
  const fpsDropdownRef = React.useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (codecDropdownRef.current && !codecDropdownRef.current.contains(e.target as Node)) setCodecOpen(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(e.target as Node)) setLevelOpen(false);
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(e.target as Node)) setSpeedOpen(false);
      if (fpsDropdownRef.current && !fpsDropdownRef.current.contains(e.target as Node)) setFpsOpen(false);
    }
    if (codecOpen || profileOpen || levelOpen || speedOpen || fpsOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [codecOpen, profileOpen, levelOpen, speedOpen, fpsOpen]);

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
  const crfRange = CRF_RANGES[codec] || { min: 0, max: 51, default: 23 };

  const formatFileSize = (size?: number): string => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // --- Custom Dropdowns ---
  const renderCodecDropdown = () => (
    <div className={dropdownStyles.dropdownContainer}>
      <label className={dropdownStyles.dropdownLabel}>Codec:</label>
      <div
        className={
          dropdownStyles.customDropdown +
          (codecOpen ? ' ' + dropdownStyles.open : '')
        }
        ref={codecDropdownRef}
      >
        <button
          type="button"
          className={dropdownStyles.customDropdownTrigger}
          onClick={() => setCodecOpen(o => !o)}
          aria-expanded={codecOpen}
        >
          {codec}
          <span className={dropdownStyles.customDropdownArrow + (codecOpen ? ' ' + dropdownStyles.open : '')}>
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
        <div
          className={dropdownStyles.customDropdownMenu}
          aria-hidden={!codecOpen}
          style={!codecOpen ? { pointerEvents: 'none' } : undefined}
        >
          {codecs.map(c => (
            <button
              type="button"
              key={c}
              className={`${dropdownStyles.customDropdownOption}${codec === c ? ' ' + dropdownStyles.selected : ''}`}
              tabIndex={codecOpen ? 0 : -1}
              onClick={() => {
                onSettingsChange({ ...settings, codec: c });
                setCodecOpen(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileDropdown = () => {
    if (!profiles.length) return null;
    // Use format-specific settings for profile
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    return (
      <div className={dropdownStyles.dropdownContainer}>
        <label className={dropdownStyles.dropdownLabel}>Profile:</label>
        <div
          className={
            dropdownStyles.customDropdown +
            (profileOpen ? ' ' + dropdownStyles.open : '')
          }
          ref={profileDropdownRef}
        >
          <button
            type="button"
            className={dropdownStyles.customDropdownTrigger}
            onClick={() => setProfileOpen(o => !o)}
            aria-expanded={profileOpen}
          >
            {'profile' in fs ? fs.profile : profiles[0]}
            <span className={dropdownStyles.customDropdownArrow + (profileOpen ? ' ' + dropdownStyles.open : '')}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          <div
            className={dropdownStyles.customDropdownMenu}
            aria-hidden={!profileOpen}
            style={!profileOpen ? { pointerEvents: 'none' } : undefined}
          >
            {profiles.map(p => (
              <button
                type="button"
                key={p}
                className={`${dropdownStyles.customDropdownOption}${'profile' in fs && fs.profile === p ? ' ' + dropdownStyles.selected : ''}`}
                tabIndex={profileOpen ? 0 : -1}
                onClick={() => {
                  onSettingsChange({
                    ...settings,
                    formatSpecific: {
                      ...settings.formatSpecific,
                      [format as keyof typeof settings.formatSpecific]: { ...fs, profile: p }
                    }
                  });
                  setProfileOpen(false);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLevelSlider = () => {
    if (!levels.length) return null;
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    const min = 0;
    const max = levels.length - 1;
    const value = 'level' in fs && fs.level ? levels.indexOf(fs.level) : 0;
    return (
      <div className={sliderStyles.sliderContainer}>
        <label className={sliderStyles.sliderLabel}>Level:</label>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => {
            const idx = parseInt(e.target.value);
            onSettingsChange({
              ...settings,
              formatSpecific: {
                ...settings.formatSpecific,
                [format as keyof typeof settings.formatSpecific]: { ...fs, level: levels[idx] }
              }
            });
          }}
          className={sliderStyles.slider}
        />
        <span className={sliderStyles.sliderValue}>{levels[value]}</span>
      </div>
    );
  };

  // --- Speed Preset Dropdown ---
  const renderSpeedDropdown = () => {
    if (!speedPresets.length) return null;
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific];
    return (
      <div className={dropdownStyles.dropdownContainer}>
        <label className={dropdownStyles.dropdownLabel}>Speed Preset:</label>
        <div
          className={
            dropdownStyles.customDropdown +
            (speedOpen ? ' ' + dropdownStyles.open : '')
          }
          ref={speedDropdownRef}
        >
          <button
            type="button"
            className={dropdownStyles.customDropdownTrigger}
            onClick={() => setSpeedOpen(o => !o)}
            aria-expanded={speedOpen}
          >
            {fs.speed || speedPresets[0]}
            <span className={dropdownStyles.customDropdownArrow + (speedOpen ? ' ' + dropdownStyles.open : '')}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
          <div
            className={dropdownStyles.customDropdownMenu}
            aria-hidden={!speedOpen}
            style={!speedOpen ? { pointerEvents: 'none' } : undefined}
          >
            {speedPresets.map(preset => (
              <button
                type="button"
                key={preset}
                className={`${dropdownStyles.customDropdownOption}${fs.speed === preset ? ' ' + dropdownStyles.selected : ''}`}
                tabIndex={speedOpen ? 0 : -1}
                onClick={() => {
                  onSettingsChange({
                    ...settings,
                    formatSpecific: {
                      ...settings.formatSpecific,
                      [format as keyof typeof settings.formatSpecific]: { ...fs, speed: preset }
                    }
                  });
                  setSpeedOpen(false);
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- FPS Custom Dropdown ---
  const renderFPSDropdown = () => (
    <div className={dropdownStyles.dropdownContainer}>
      <label className={dropdownStyles.dropdownLabel}>FPS:</label>
      <div
        className={
          dropdownStyles.customDropdown +
          (fpsOpen ? ' ' + dropdownStyles.open : '')
        }
        ref={fpsDropdownRef}
      >
        <button
          type="button"
          className={dropdownStyles.customDropdownTrigger}
          onClick={() => setFpsOpen(o => !o)}
          aria-expanded={fpsOpen}
        >
          {settings.fps === null || settings.fps === undefined ? 'Auto' : `${settings.fps} fps`}
          <span className={dropdownStyles.customDropdownArrow + (fpsOpen ? ' ' + dropdownStyles.open : '')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
        <div
          className={dropdownStyles.customDropdownMenu}
          aria-hidden={!fpsOpen}
          style={!fpsOpen ? { pointerEvents: 'none' } : undefined}
        >
          <button
            type="button"
            className={`${dropdownStyles.customDropdownOption}${settings.fps === null || settings.fps === undefined ? ' ' + dropdownStyles.selected : ''}`}
            tabIndex={fpsOpen ? 0 : -1}
            onClick={() => {
              onSettingsChange({ ...settings, fps: null });
              setFpsOpen(false);
            }}
          >
            Auto
          </button>
          {FPS_OPTIONS.filter(fps => fps !== null).map(fps => (
            <button
              type="button"
              key={fps}
              className={`${dropdownStyles.customDropdownOption}${settings.fps === fps ? ' ' + dropdownStyles.selected : ''}`}
              tabIndex={fpsOpen ? 0 : -1}
              onClick={() => {
                onSettingsChange({ ...settings, fps: fps as number });
                setFpsOpen(false);
              }}
            >
              {fps} fps
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // --- Format-specific settings ---
  const renderFormatSpecificSettings = () => {
    const fs = settings.formatSpecific[format as keyof typeof settings.formatSpecific] || {};
    switch (format) {
      case 'mp4':
      case 'mkv':
      case 'mov':
      case 'ts':
      case 'mts': {
        if (!fs) return null;
        return (
          <div className={styles.formatSpecificSettings}>
            <h4>{format.toUpperCase()} Specific Settings</h4>
            {renderProfileDropdown()}
            {renderLevelSlider()}
            {renderSpeedDropdown()}
            {/* CRF Slider (inline, not a separate render function) */}
            <div className={sliderStyles.sliderContainer}>
              <label className={sliderStyles.sliderLabel}>
              CRF (Quality):
              </label>
              <input
              type="range"
              min={crfRange.min}
              max={crfRange.max}
              value={'crf' in fs ? fs.crf : crfRange.default}
              onChange={e => onSettingsChange({
                ...settings,
                formatSpecific: {
                ...settings.formatSpecific,
                [format as keyof typeof settings.formatSpecific]: { ...fs, crf: parseInt(e.target.value) }
                }
              })}
              className={sliderStyles.slider}
              />
              <span className={sliderStyles.sliderValue}>{'crf' in fs ? fs.crf : crfRange.default}</span>
            </div>
            {/* Bitrate */}
            <div className={sliderStyles.sliderContainer}>
              <label className={sliderStyles.sliderLabel}>
              Bitrate:
              </label>
              <input
              type="range"
              min={BITRATE_MIN}
              max={BITRATE_MAX}
              step={BITRATE_STEP}
              value={parseInt(fs.bitrate)}
              onChange={e => onSettingsChange({
                ...settings,
                formatSpecific: {
                ...settings.formatSpecific,
                [format as keyof typeof settings.formatSpecific]: { ...fs, bitrate: `${e.target.value}` }
                }
              })}
              className={sliderStyles.slider}
              />
              <span className={sliderStyles.sliderValue}>{(parseInt(fs.bitrate) / 1000).toFixed(1)}M</span>
            </div>
          </div>
        );
      }
      case 'webm': {
        if (!fs) return null;
        return (
          <div className={styles.formatSpecificSettings}>
            <h4>WEBM Specific Settings</h4>
            {renderSpeedDropdown()}
            {/* Bitrate */}
            <div className={sliderStyles.sliderContainer}>
              <label className={sliderStyles.sliderLabel}>
              Bitrate (Mbps):
              </label>
              <input
              type="range"
              min={BITRATE_MIN}
              max={BITRATE_MAX}
              step={BITRATE_STEP}
              value={parseInt(fs.bitrate)}
              onChange={e => onSettingsChange({
                ...settings,
                formatSpecific: {
                  ...settings.formatSpecific,
                  webm: { ...fs, bitrate: `${e.target.value}` }
                }
              })}
              className={sliderStyles.slider}
              />
              <span className={sliderStyles.sliderValue}>{(parseInt(fs.bitrate) / 1000).toFixed(1)}M</span>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsContainer}>
        <h2 className={styles.settingsTitle}>
          <span>
            <svg className={styles.gearIcon} viewBox="0 0 24 24" fill="none">
              <path d="M12 8.25C9.92894 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92894 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z" fill="#1C274C"></path>
              <path d="M11.9747 1.25C11.5303 1.24999 11.1592 1.24999 10.8546 1.27077C10.5375 1.29241 10.238 1.33905 9.94761 1.45933C9.27379 1.73844 8.73843 2.27379 8.45932 2.94762C8.31402 3.29842 8.27467 3.66812 8.25964 4.06996C8.24756 4.39299 8.08454 4.66251 7.84395 4.80141C7.60337 4.94031 7.28845 4.94673 7.00266 4.79568C6.64714 4.60777 6.30729 4.45699 5.93083 4.40743C5.20773 4.31223 4.47642 4.50819 3.89779 4.95219C3.64843 5.14353 3.45827 5.3796 3.28099 5.6434C3.11068 5.89681 2.92517 6.21815 2.70294 6.60307L2.67769 6.64681C2.45545 7.03172 2.26993 7.35304 2.13562 7.62723C1.99581 7.91267 1.88644 8.19539 1.84541 8.50701C1.75021 9.23012 1.94617 9.96142 2.39016 10.5401C2.62128 10.8412 2.92173 11.0602 3.26217 11.2741C3.53595 11.4461 3.68788 11.7221 3.68786 12C3.68785 12.2778 3.53592 12.5538 3.26217 12.7258C2.92169 12.9397 2.62121 13.1587 2.39007 13.4599C1.94607 14.0385 1.75012 14.7698 1.84531 15.4929C1.88634 15.8045 1.99571 16.0873 2.13552 16.3727C2.26983 16.6469 2.45535 16.9682 2.67758 17.3531L2.70284 17.3969C2.92507 17.7818 3.11058 18.1031 3.28089 18.3565C3.45817 18.6203 3.64833 18.8564 3.89769 19.0477C4.47632 19.4917 5.20763 19.6877 5.93073 19.5925C6.30717 19.5429 6.647 19.3922 7.0025 19.2043C7.28833 19.0532 7.60329 19.0596 7.8439 19.1986C8.08452 19.3375 8.24756 19.607 8.25964 19.9301C8.27467 20.3319 8.31403 20.7016 8.45932 21.0524C8.73843 21.7262 9.27379 22.2616 9.94761 22.5407C10.238 22.661 10.5375 22.7076 10.8546 22.7292C11.1592 22.75 11.5303 22.75 11.9747 22.75H12.0252C12.4697 22.75 12.8407 22.75 13.1454 22.7292C13.4625 22.7076 13.762 22.661 14.0524 22.5407C14.7262 22.2616 15.2616 21.7262 15.5407 21.0524C15.686 20.7016 15.7253 20.3319 15.7403 19.93C15.7524 19.607 15.9154 19.3375 16.156 19.1985C16.3966 19.0596 16.7116 19.0532 16.9974 19.2042C17.3529 19.3921 17.6927 19.5429 18.0692 19.5924C18.7923 19.6876 19.5236 19.4917 20.1022 19.0477C20.3516 18.8563 20.5417 18.6203 20.719 18.3565C20.8893 18.1031 21.0748 17.7818 21.297 17.3969L21.3223 17.3531C21.5445 16.9682 21.7301 16.6468 21.8644 16.3726C22.0042 16.0872 22.1135 15.8045 22.1546 15.4929C22.2498 14.7697 22.0538 14.0384 21.6098 13.4598C21.3787 13.1586 21.0782 12.9397 20.7378 12.7258C20.464 12.5538 20.3121 12.2778 20.3121 11.9999C20.3121 11.7221 20.464 11.4462 20.7377 11.2742C21.0783 11.0603 21.3788 10.8414 21.6099 10.5401C22.0539 9.96149 22.2499 9.23019 22.1547 8.50708C22.1136 8.19546 22.0043 7.91274 21.8645 7.6273C21.7302 7.35313 21.5447 7.03183 21.3224 6.64695L21.2972 6.60318C21.0749 6.21825 20.8894 5.89688 20.7191 5.64347C20.5418 5.37967 20.3517 5.1436 20.1023 4.95225C19.5237 4.50826 18.7924 4.3123 18.0692 4.4075C17.6928 4.45706 17.353 4.60782 16.9975 4.79572C16.7117 4.94679 16.3967 4.94036 16.1561 4.80144C15.9155 4.66253 15.7524 4.39297 15.7403 4.06991C15.7253 3.66808 15.686 3.2984 15.5407 2.94762C15.2616 2.27379 14.7262 1.73844 14.0524 1.45933C13.762 1.33905 13.4625 1.29241 13.1454 1.27077C12.8407 1.24999 12.4697 1.24999 12.0252 1.25H11.9747ZM10.5216 2.84515C10.5988 2.81319 10.716 2.78372 10.9567 2.76729C11.2042 2.75041 11.5238 2.75 12 2.75C12.4762 2.75 12.7958 2.75041 13.0432 2.76729C13.284 2.78372 13.4012 2.81319 13.4783 2.84515C13.7846 2.97202 14.028 3.21536 14.1548 3.52165C14.1949 3.61826 14.228 3.76887 14.2414 4.12597C14.271 4.91835 14.68 5.68129 15.4061 6.10048C16.1321 6.51968 16.9974 6.4924 17.6984 6.12188C18.0143 5.9549 18.1614 5.90832 18.265 5.89467C18.5937 5.8514 18.9261 5.94047 19.1891 6.14228C19.2554 6.19312 19.3395 6.27989 19.4741 6.48016C19.6125 6.68603 19.7726 6.9626 20.0107 7.375C20.2488 7.78741 20.4083 8.06438 20.5174 8.28713C20.6235 8.50382 20.6566 8.62007 20.6675 8.70287C20.7108 9.03155 20.6217 9.36397 20.4199 9.62698C20.3562 9.70995 20.2424 9.81399 19.9397 10.0041C19.2684 10.426 18.8122 11.1616 18.8121 11.9999C18.8121 12.8383 19.2683 13.574 19.9397 13.9959C20.2423 14.186 20.3561 14.29 20.4198 14.373C20.6216 14.636 20.7107 14.9684 20.6674 15.2971C20.6565 15.3799 20.6234 15.4961 20.5173 15.7128C20.4082 15.9355 20.2487 16.2125 20.0106 16.6249C19.7725 17.0373 19.6124 17.3139 19.474 17.5198C19.3394 17.72 19.2553 17.8068 19.189 17.8576C18.926 18.0595 18.5936 18.1485 18.2649 18.1053C18.1613 18.0916 18.0142 18.045 17.6983 17.8781C16.9973 17.5075 16.132 17.4803 15.4059 17.8995C14.68 18.3187 14.271 19.0816 14.2414 19.874C14.228 20.2311 14.1949 20.3817 14.1548 20.4784C14.028 20.7846 13.7846 21.028 13.4783 21.1549C13.4012 21.1868 13.284 21.2163 13.0432 21.2327C12.7958 21.2496 12.4762 21.25 12 21.25C11.5238 21.25 11.2042 21.2496 10.9567 21.2327C10.716 21.2163 10.5988 21.1868 10.5216 21.1549C10.2154 21.028 9.97201 20.7846 9.84514 20.4784C9.80512 20.3817 9.77195 20.2311 9.75859 19.874C9.72896 19.0817 9.31997 18.3187 8.5939 17.8995C7.86784 17.4803 7.00262 17.5076 6.30158 17.8781C5.98565 18.0451 5.83863 18.0917 5.73495 18.1053C5.40626 18.1486 5.07385 18.0595 4.81084 17.8577C4.74458 17.8069 4.66045 17.7201 4.52586 17.5198C4.38751 17.314 4.22736 17.0374 3.98926 16.625C3.75115 16.2126 3.59171 15.9356 3.4826 15.7129C3.37646 15.4962 3.34338 15.3799 3.33248 15.2971C3.28921 14.9684 3.37828 14.636 3.5801 14.373C3.64376 14.2901 3.75761 14.186 4.0602 13.9959C4.73158 13.5741 5.18782 12.8384 5.18786 12.0001C5.18791 11.1616 4.73165 10.4259 4.06021 10.004C3.75769 9.81389 3.64385 9.70987 3.58019 9.62691C3.37838 9.3639 3.28931 9.03149 3.33258 8.7028C3.34348 8.62001 3.37656 8.50375 3.4827 8.28707C3.59181 8.06431 3.75125 7.78734 3.98935 7.37493C4.22746 6.96253 4.3876 6.68596 4.52596 6.48009C4.66055 6.27983 4.74468 6.19305 4.81093 6.14222C5.07395 5.9404 5.40636 5.85133 5.73504 5.8946C5.83873 5.90825 5.98576 5.95483 6.30173 6.12184C7.00273 6.49235 7.86791 6.51962 8.59394 6.10045C9.31998 5.68128 9.72896 4.91837 9.75859 4.12602C9.77195 3.76889 9.80512 3.61827 9.84514 3.52165C9.97201 3.21536 10.2154 2.97202 10.5216 2.84515Z" fill="#1C274C"></path>
            </svg>
            Video Settings
          </span>
        </h2>
        <h3 className={styles.settingsfileName}>
          {fileName} {fileSize && `(${formatFileSize(fileSize)})`}
        </h3>
        <div className={styles.settingOption}>
          {/* Remove Metadata */}
          <div className={checkboxStyles.checkboxWrapper}>
            <label className={checkboxStyles.checkbox}>
              <input
                type="checkbox"
                className={`${checkboxStyles.checkboxTrigger} ${checkboxStyles.visuallyHidden}`}
                checked={settings.removeMetadata}
                onChange={e => onSettingsChange({ ...settings, removeMetadata: e.target.checked })}
              />
              <span className={checkboxStyles.checkboxSymbol}>
                <svg className={checkboxStyles.checkboxIcon} aria-hidden="true" viewBox="0 0 12 10">
                  <path d="M1 5.50025L3.99975 8.5L11.0005 1.5"></path>
                </svg>
              </span>
              <p className={checkboxStyles.checkboxTextwrapper}>Remove Metadata</p>
            </label>
          </div>
          {/* FPS */}
          {renderFPSDropdown()}
          {/* Codec */}
          {renderCodecDropdown()}
        </div>
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
