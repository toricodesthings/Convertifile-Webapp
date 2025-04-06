'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { isDark, setIsDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      const isMobileOrPortrait = mobile || portrait;
      setIsMobile(isMobileOrPortrait);
      setNavVisible(!isMobileOrPortrait);
    };

    // Run on initial mount
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const toggleNav = () => {
    if (isMobile) {
      requestAnimationFrame(() => {
        setNavVisible(!navVisible);
      });
    }
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const isActive = (path: string) => {
    // This would need to be updated to use Next.js router
    return typeof window !== 'undefined' && window.location.pathname === path;
  };

  return (
    <>
      {isMobile && <div className={`mobile-overlay ${navVisible ? "active" : ""}`} />}
      <div className={`navbar ${isMobile && navVisible ? "active" : ""}`}>
        {isMobile ? (
          <div className="avatar-hovanimate" onClick={toggleNav}>
            <div className="avatar-wrapper">
              <Image src="/logo.png" alt="Avatar" fill className="avatar" />
            </div>
          </div>
        ) : (
          <div className="avatar-hovanimate">
            <div className="avatar-wrapper">
              <Link href="/">
                <Image src="/logo.png" alt="Avatar" fill className="avatar" />
              </Link>
            </div>
          </div>
        )}

        <ul className={`nav-menu ${isMobile && navVisible ? "active" : ""}`}>
          <div className="pop-up">
            <li className={isActive('/') ? 'active' : ''}>
              <Link href="/" onClick={isMobile ? toggleNav : undefined}>Home</Link>
            </li>
          </div>
          <div className="pop-up">
            <li className={isActive('/imageconv') ? 'active' : ''}>
              <Link href="/imageconv" onClick={isMobile ? toggleNav : undefined}>Image</Link>
            </li>
          </div>
          <div className="pop-up">
            <li className={isActive('/mediaoconv') ? 'active' : ''}>
              <Link href="/mediaoconv" onClick={isMobile ? toggleNav : undefined}>Media</Link>
            </li>
          </div>
          <div className="pop-up">
            <li className={isActive('/fileconv') ? 'active' : ''}>
              <Link href="/fileconv" onClick={isMobile ? toggleNav : undefined}>Document</Link>
            </li>
          </div>
          <div className="pop-up">
            <li className={isActive('/filecompress') ? 'active' : ''}>
              <Link href="/filecompress" onClick={isMobile ? toggleNav : undefined}>Compress</Link>
            </li>
          </div>
          <div className="pop-up">
            <li className={isActive('/help') ? 'active' : ''}>
              <Link href="/help" onClick={isMobile ? toggleNav : undefined}>Help</Link>
            </li>
          </div>
        </ul>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          justifyContent: 'center'
        }}>
          <div className="pop-up">
            <div className={`nav-switch-wrapper ${isMobile && navVisible ? "active" : ""}`}>
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
        </div>
      </div>
    </>
  );
};

export default Navbar;