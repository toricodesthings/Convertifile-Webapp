import React from 'react';
import sliderStyles from './slider.module.css';

interface SettingsSliderProps {
  label: React.ReactNode;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  valueDisplay?: React.ReactNode;
  containerClassName?: string;
}

const SettingsSlider: React.FC<SettingsSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled = false,
  valueDisplay,
  containerClassName,
}) => (
  <div className={containerClassName || sliderStyles.sliderContainer}>
    <label className={sliderStyles.sliderLabel}>{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      disabled={disabled}
      className={sliderStyles.slider}
    />
    <span className={sliderStyles.sliderValue}>
      {valueDisplay !== undefined ? valueDisplay : value}
    </span>
  </div>
);

export default SettingsSlider;
