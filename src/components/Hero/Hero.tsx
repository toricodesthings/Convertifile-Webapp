"use client";

import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import Loader from "@/components/LoadingUI/Loader";
import ServerStatus from './Status';
import Image from "next/image";
import styles from "../../app/page.module.css";
import Link from "next/link";

import videoIcon from '@/assets/main/video.svg';
import imgIcon from '@/assets/main/image.svg';
import docIcon from '@/assets/main/document.svg';

const cloudImage = "/mainpage/transparentclouds.webp"

export default function HomeClient() {
  const [showAnimations, setShowAnimations] = useState(false);
  const [backgroundsLoaded, setBackgroundsLoaded] = useState(false);
  
  const { ref: titleRef, inView: titleInViewRaw } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const { ref: containerRef, inView: containerInViewRaw } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  // Preload background images using window.Image instead of Image
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const darkBackground = new window.Image();
    const lightBackground = new window.Image();
    let darkLoaded = false;
    let lightLoaded = false;

    darkBackground.src = '/mainpage/backgrounddark.webp';
    lightBackground.src = '/mainpage/backgroundlight.webp';

    const checkAllLoaded = () => {
      if (darkLoaded && lightLoaded) {
        setBackgroundsLoaded(true);
      }
    };

    darkBackground.onload = () => {
      darkLoaded = true;
      checkAllLoaded();
    };

    lightBackground.onload = () => {
      lightLoaded = true;
      checkAllLoaded();
    };

    // Fallback in case images don't load
    const timeout = setTimeout(() => {
      setBackgroundsLoaded(true);
    }, 2000);

    return () => { clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if ((titleInViewRaw || containerInViewRaw) && backgroundsLoaded) {
      const timer = setTimeout(() => {
        setShowAnimations(true);
      }, 800);
      
      return () => { clearTimeout(timer); };
    }
  }, [titleInViewRaw, containerInViewRaw, backgroundsLoaded]);

  return (
    <div className={styles["home-page"]}>
      {!backgroundsLoaded && (
        <div className={styles["loading-container"]}>
          <Loader />
          <h2>Loading...</h2>
        </div>
      )}
      <Image 
        src={cloudImage} 
        alt="Cloud Left" 
        className={`${styles.cloud} ${styles["cloud-left"]} ${backgroundsLoaded ? styles["animate-cloud"] : ''}`}
        width={500}
        priority
        height={300}
      />
      <Image 
        src={cloudImage} 
        alt="Cloud Right" 
        className={`${styles.cloud} ${styles["cloud-right"]} ${backgroundsLoaded ? styles["animate-cloud"] : ''}`}
        width={500}
        priority
        height={300}
      />
      <div className={styles["perspective-wrapper"]}>
        <div className={`${styles["background-zoom"]} ${backgroundsLoaded ? styles["animate-background"] : ''}`}></div>
      </div>

      <div className={styles["convertifile-maincontainer"]}>
        <div ref={titleRef} className={styles["convertifile-title"]}>
          <h1 className={`${styles["title-gradient"]} ${styles["text-animate"]} ${showAnimations && backgroundsLoaded ? styles["in-view"] : ''}`}>
            Convertifile
          </h1>
          <h1 className={`${styles["title-norm"]} ${styles["text-animate"]} ${showAnimations && backgroundsLoaded ? styles["in-view"] : ''}`}>
            All-In-One File Conversion Suite
          </h1>
        </div>
        {/* Replace the hardcoded status with the ServerStatus component */}
        <div className={`${styles["title-status"]} ${styles["text-animate"]} ${showAnimations && backgroundsLoaded ? styles["in-view"] : ''}`}>
          <ServerStatus styles={styles} />
        </div>
        <div className={styles["convertifile-panel"]}>
          <div ref={containerRef} className={styles["convertifile-container"]}>
            <Link href="/imageconverter" className={styles["convertifile-btnlink"]}>
              <div className={styles.hoveranimation}>
                <span className={showAnimations && backgroundsLoaded ? styles["in-view"] : ''}>
                  <Image src={imgIcon} alt="Image Icon" width="64" height="64" className={styles.icon} />
                  Image Convert
                </span>
              </div>
            </Link>
            <Link href="/mediaconverter" className={styles["convertifile-btnlink"]}>
              <div className={styles.hoveranimation}>
                <span className={`${showAnimations && backgroundsLoaded ? styles["in-view"] : ''}`}>
                  <Image src={videoIcon} alt="Video Icon" width="64" height="64" className={styles.icon} />
                  Media Convert
                </span>
              </div>
            </Link>
            <Link href="/documentconverter" className={styles["convertifile-btnlink"]}>
              <div className={styles["hoveranimation"]}>
                <span className={`${showAnimations && backgroundsLoaded ? styles["in-view"] : ''}`}>
                  <Image src={docIcon} alt="Document Icon" width="64" height="64" className={styles.icon} />
                  Document Convert
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
