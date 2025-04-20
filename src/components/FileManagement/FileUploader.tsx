import React, { RefObject } from 'react';
import uploaderInstructionStyles from './uploaderInstruction.module.css';
import uploadButtonStyles from './uploadButton.module.css';

interface FileUploaderProps {
  isDragging: boolean;
  filesExist: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  maxFileSize: number[];
  maxFilesCount: number;
  availableFormats: string[][];
  onButtonClick: () => void;
  uploaderType?: string;
  noteLabels?: string[];
}

const formatSize = (size: number) =>
  size >= 1000 ? (size / 1024).toFixed(1) + 'GB' : size + 'MB';

/**
 * FileUploader component for drag-and-drop or button file selection
 * 
 * @param props - Component props containing drag state and handlers
 * @returns React component
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  maxFileSize,
  maxFilesCount,
  availableFormats,
  onButtonClick,
  uploaderType,
  noteLabels = [],
}) => {

  const sizes = Array.isArray(maxFileSize) ? maxFileSize : [maxFileSize];
  const counts = maxFilesCount;
  const formats = availableFormats;

  return (
    <div className={uploaderInstructionStyles.uploadInstruction}>
      <div className={uploaderInstructionStyles.mainInstruction}>
        <h2 className={uploaderInstructionStyles.instructTitle}>Select File(s)</h2>

        <button className={uploadButtonStyles.uploadButton} onClick={onButtonClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={uploadButtonStyles["arr-2"]}>
            <line y2={19} y1={5} x2={12} x1={12} />
            <line y2={12} y1={12} x2={19} x1={5} />
          </svg>
          <span className={uploadButtonStyles.buttonText}>Add File(s)</span>
          <span className={uploadButtonStyles.circle} />
          <svg xmlns="http://www.w3.org/2000/svg" width={24} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height={24} fill="none" className={uploadButtonStyles["arr-1"]}>
            <line y2={19} y1={5} x2={12} x1={12} />
            <line y2={12} y1={12} x2={19} x1={5} />
          </svg>
        </button>

        <p className={uploaderInstructionStyles.dragDropNote}>
          Or Drag and Drop
        </p>
      </div>
      <p className={uploaderInstructionStyles.uploaderNote}>
        {uploaderType === 'media' && availableFormats.length > 1 ? (
          <>
            Supports {noteLabels[0]} Format:{" "}
            <span
              style={{
                display: "inline-block",
                position: "relative",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: "bold"
              }}
            >
              (∘∘∘)
              <span
                style={{
                  visibility: "hidden",
                  fontWeight: "300",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  position: "absolute",
                  transform: "translateX(-50%)",
                  bottom: "120%",
                  background: "rgba(var(--secondary-color-rgb), 0.4)",
                  color: "var(--text-color)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "48px",
                  whiteSpace: "wrap",
                  width: "max-content",
                  maxWidth: "80vw",
                  zIndex: 100,
                  pointerEvents: "none"
                }}
                className="supportedFormatsTooltip"
              >
                {availableFormats[0].join(", ").toUpperCase()}
              </span>
              <style>{`
          .${uploaderInstructionStyles.uploaderNote} span:hover .supportedFormatsTooltip,
          .${uploaderInstructionStyles.uploaderNote} span:focus .supportedFormatsTooltip {
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          @media (max-width: 768px) {
            .supportedFormatsTooltip {
              max-width: 90vw !important;
              font-size: 0.8rem !important;
            }
          }
        `}</style>
            </span>
            {" "}OR {noteLabels[1]} Format:{" "}
            <span
              style={{
                display: "inline-block",
                position: "relative",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: "bold"
              }}
            >
              (∘∘∘)
              <span
                style={{
                  visibility: "hidden",
                  fontWeight: "300",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  position: "absolute",
                  transform: "translateX(-50%)",
                  bottom: "120%",
                  background: "rgba(var(--secondary-color-rgb), 0.4)",
                  color: "var(--text-color)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "48px",
                  whiteSpace: "wrap",
                  width: "max-content",
                  maxWidth: "80vw",
                  zIndex: 100,
                  pointerEvents: "none"
                }}
                className="supportedFormatsTooltip"
              >
                {availableFormats[1].join(", ").toUpperCase()}
              </span>
            </span>
            {" "}| Max: {counts} files | {formatSize(sizes[0])}/{formatSize(sizes[1])} per Video/Audio | Deletes after 15 Minutes
          </>
        ) : uploaderType === 'document' && noteLabels[0] === 'Documents' ? (
          <>
            Supported Documents Formats:{" "}
            <span
              style={{
                display: "inline-block",
                position: "relative",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: "bold"
              }}
            >
              (∘∘∘)
              <span
                style={{
                  visibility: "hidden",
                  fontWeight: "300",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  position: "absolute",
                  transform: "translateX(-50%)",
                  bottom: "120%",
                  background: "rgba(var(--secondary-color-rgb), 0.4)",
                  color: "var(--text-color)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "48px",
                  whiteSpace: "wrap",
                  width: "max-content",
                  maxWidth: "80vw",
                  zIndex: 100,
                  pointerEvents: "none"
                }}
                className="supportedFormatsTooltip"
              >
                {formats[0].join(", ").toUpperCase()}
              </span>
              <style>{`
          .${uploaderInstructionStyles.uploaderNote} span:hover .supportedFormatsTooltip,
          .${uploaderInstructionStyles.uploaderNote} span:focus .supportedFormatsTooltip {
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          @media (max-width: 768px) {
            .supportedFormatsTooltip {
              max-width: 90vw !important;
              font-size: 0.8rem !important;
            }
          }
        `}</style>
            </span>
            {" "}| Max: {counts} files | {formatSize(sizes[0])} per Document | Deletes after 15 Minutes
          </>
        ) : (
          <>
            Supported {noteLabels[0]} Formats:{" "}
            <span
              style={{
                display: "inline-block",
                position: "relative",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: "bold"
              }}
            >
              (∘∘∘)
              <span
                style={{
                  visibility: "hidden",
                  fontWeight: "300",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  position: "absolute",
                  transform: "translateX(-50%)",
                  bottom: "120%",
                  background: "rgba(var(--secondary-color-rgb), 0.4)",
                  color: "var(--text-color)",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "48px",
                  whiteSpace: "wrap",
                  width: "max-content",
                  maxWidth: "80vw",
                  zIndex: 100,
                  pointerEvents: "none"
                }}
                className="supportedFormatsTooltip"
              >
                {formats[0].join(", ").toUpperCase()}
              </span>
              <style>{`
          .${uploaderInstructionStyles.uploaderNote} span:hover .supportedFormatsTooltip,
          .${uploaderInstructionStyles.uploaderNote} span:focus .supportedFormatsTooltip {
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          @media (max-width: 768px) {
            .supportedFormatsTooltip {
              max-width: 90vw !important;
              font-size: 0.8rem !important;
            }
          }
        `}</style>
            </span>
            {" "}| Max: {counts} files | {formatSize(sizes[0])} per Image | Deletes after 15 Minutes
          </>
        )}
      </p>
    </div>
  );
};

export default FileUploader;
