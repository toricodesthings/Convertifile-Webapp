import React from 'react';
import checkboxStyles from './checkbox.module.css';

interface SettingsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

const SettingsCheckbox: React.FC<SettingsCheckboxProps> = ({ checked, onChange, children }) => (
  <div className={checkboxStyles.checkboxWrapper}>
    <label className={checkboxStyles.checkbox}>
      <input
        type="checkbox"
        className={`${checkboxStyles.checkboxTrigger} ${checkboxStyles.visuallyHidden}`}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className={checkboxStyles.checkboxSymbol}>
        <svg className={checkboxStyles.checkboxIcon} aria-hidden="true" viewBox="0 0 12 10">
          <path d="M1 5.50025L3.99975 8.5L11.0005 1.5"></path>
        </svg>
      </span>
      {children}
    </label>
  </div>
);

export default SettingsCheckbox;
