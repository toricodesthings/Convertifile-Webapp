import React, { RefObject } from 'react';
import styles from '../../app/imageconverter/imageconverter.module.css';

interface FileUploaderProps {
  isDragging: boolean;
  filesExist: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onButtonClick: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

/**
 * FileUploader component for drag-and-drop or button file selection
 * 
 * @param props - Component props containing drag state and handlers
 * @returns React component
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  isDragging,
  filesExist,
  fileInputRef,
  onButtonClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  return (
    <div className={styles.uploadInstruction}>
      <h2 className={styles.instructTitle}>Select File(s)</h2>

      <button className={styles.uploadButton} onClick={onButtonClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={styles["arr-2"]}>
          <line y2={19} y1={5} x2={12} x1={12} />
          <line y2={12} y1={12} x2={19} x1={5} />
        </svg>
        <span className={styles.buttonText}>Add File(s)</span>
        <span className={styles.circle} />
        <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={styles["arr-1"]}>
          <line y2={19} y1={5} x2={12} x1={12} />
          <line y2={12} y1={12} x2={19} x1={5} />
        </svg>
      </button>

      <p className={styles.dragDropNote}>
        Or Drag and Drop
      </p>
    </div>
  );
};

export default FileUploader;
