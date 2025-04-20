import React, { useRef, useEffect } from 'react';

interface DropDownProps {
  label?: string;
  trigger: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  containerClassName?: string;
  dropdownClassName?: string;
  menuClassName?: string;
  labelClassName?: string;
  dropdownRef?: React.RefObject<HTMLDivElement>;
}

const DropDown: React.FC<DropDownProps> = ({
  label,
  trigger,
  open,
  setOpen,
  children,
  containerClassName = '',
  dropdownClassName = '',
  menuClassName = '',
  labelClassName = '',
  dropdownRef,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = dropdownRef || localRef;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => { document.removeEventListener('mousedown', handleClick); };
  }, [open, setOpen, ref]);

  return (
    <div className={containerClassName}>
      {label && <label className={labelClassName}>{label}</label>}
      <div className={dropdownClassName + (open ? ' open' : '')} ref={ref}>
        {trigger}
        <div
          className={menuClassName}
          aria-hidden={!open}
          style={!open ? { pointerEvents: 'none' } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default DropDown;
