'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { isDark, setIsDark } = useTheme();

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };


  const [isMobile, setIsMobile] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    const updateLayout = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      const isMobileOrPortrait = mobile || portrait;
      setIsMobile(isMobileOrPortrait);
      setNavVisible(!isMobileOrPortrait);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const toggleNav = () => {
    if (isMobile) {
      setNavVisible(!navVisible);
    }
  };

  return (
    <div className="navbar">
      {isMobile ? (
        <div className="avatar-hovanimate" onClick={toggleNav}>
          <div className="avatar-wrapper">
            <Image src="/logo.png" alt="Avatar" fill className="avatar" />
          </div>
        </div>
      ) : (
        <div className="avatar-hovanimate">
          <div className="avatar-wrapper">
            <Link href="https://toridoesthings.xyz">
              <Image src="/logo.png" alt="Avatar" fill className="avatar" />
            </Link>
          </div>
        </div>
      )}

      <ul className={`nav-menu ${isMobile && navVisible ? 'active' : ''}`}>
        <div className="pop-up"><li><Link href="/">Home</Link></li></div>
        <div className="pop-up"><li><Link href="/imageconv">Image</Link></li></div>
        <div className="pop-up"><li><Link href="/videoconv">Video</Link></li></div>
        <div className="pop-up"><li><Link href="/fileconv">Document</Link></li></div>
        <div className="pop-up"><li><Link href="/help">Help</Link></li></div>
      </ul>

      <div className={`nav-switch-wrapper ${isMobile && navVisible ? 'active' : ''}`}>
          <div className="toggle-switch">
          <label className="switch-label">
            <input
              type="checkbox"
              className="checkbox"
              checked={!isDark}
              onChange={handleThemeToggle}
            />
            <span className="slider"></span>
          </label>
        </div>  
      </div>
    </div>
  );
};

export default Navbar;
