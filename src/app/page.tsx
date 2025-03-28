import Image from "next/image";
import styles from "./page.module.css";

import videoIcon from '@/assets/main/video.svg';
import imgIcon from '@/assets/main/image.svg';
import docIcon from '@/assets/main/document.svg';

export default function Home() {
  return (
    <div className={styles["home-page"]}>
      <div className={styles["convertifile-maincontainer"]}>
          <div className={styles["convertifile-title"]}>
            <h1 className={styles["title-gradient"] + " type"} data-text="Convertifile">Convertifile</h1>
            <h1 className={styles["title-norm"] + " pop-in"}>All-In-One File Conversion Suite</h1>
          </div>

          <div className={styles["convertifile-panel"]}>
            <div className={styles["convertifile-container"]}>
              <a href="https://example.com" className={styles["convertifile-btnlink"]}>
                <span><Image src={imgIcon} alt="Image Icon" width="64" height = "64" className={styles.icon} />Image Convert</span>
              </a>
              <a href="https://example.com" className={styles["convertifile-btnlink"]}>
                <span><Image src={videoIcon} alt="Video Icon" width="64" height = "64" className={styles.icon} />Video Convert</span>
              </a>
              <a href="https://example.com" className={styles["convertifile-btnlink"]}>
                <span><Image src={docIcon} alt="Document Icon" width="64" height = "64" className={styles.icon} />Document Convert</span>
              </a>
            </div>
          </div>
      </div>
    </div>
  );
}
