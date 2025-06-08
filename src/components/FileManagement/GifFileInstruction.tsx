'use client';

import React, { useState, useRef } from 'react';
import styles from './fileInstruction.module.css';
import gifStyles from './gifFileInstruction.module.css';

interface GifFileInstructionProps {
    file: File;
    videoDuration: number;
    isConverting: boolean;
    onSettingsClick: () => void;
    onDeleteFile: () => void;
    onConvert: (startTime: number, endTime: number) => void;
    onTrimChange: (startTime: number, endTime: number) => void;
}

const GifFileInstruction: React.FC<GifFileInstructionProps> = ({
    file,
    videoDuration,
    isConverting,
    onSettingsClick,
    onDeleteFile,
    onConvert,
    onTrimChange
}) => {
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(videoDuration);
    const [isPlaying, setIsPlaying] = useState(false);    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef<'start' | 'end' | null>(null);
    const videoSrc = useRef<string | null>(null);
    const trimChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);// Create stable video URL
    React.useEffect(() => {
        if (file && !videoSrc.current) {
            videoSrc.current = URL.createObjectURL(file);
        }
          // Cleanup function
        return () => {
            if (videoSrc.current) {
                URL.revokeObjectURL(videoSrc.current);
                videoSrc.current = null;
            }
            if (trimChangeTimeoutRef.current) {
                clearTimeout(trimChangeTimeoutRef.current);
                trimChangeTimeoutRef.current = null;
            }
        };
    }, [file]);

    // Update end time when video duration changes
    React.useEffect(() => {
        if (videoDuration > 0 && endTime === 0) {
            setEndTime(videoDuration);
        }
    }, [videoDuration, endTime]);    // Notify parent of trim changes (debounced to prevent rapid updates)
    React.useEffect(() => {
        if (trimChangeTimeoutRef.current) {
            clearTimeout(trimChangeTimeoutRef.current);
        }
        
        trimChangeTimeoutRef.current = setTimeout(() => {
            onTrimChange(startTime, endTime);
        }, isDragging.current ? 100 : 0); // Debounce during dragging
        
        return () => {
            if (trimChangeTimeoutRef.current) {
                clearTimeout(trimChangeTimeoutRef.current);
            }
        };
    }, [startTime, endTime, onTrimChange]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };    const handleVideoPlay = () => {
        if (videoRef.current && !isDragging.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                // Ensure video is at start time before playing
                videoRef.current.currentTime = startTime;
                const playPromise = videoRef.current.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setIsPlaying(true);
                        })
                        .catch(error => {
                            console.log('Play interrupted:', error);
                            setIsPlaying(false);
                        });
                } else {
                    setIsPlaying(true);
                }
            }
        }
    };

    const handleVideoTimeUpdate = () => {
        if (videoRef.current && videoRef.current.currentTime >= endTime) {
            videoRef.current.pause();
            setIsPlaying(false);
            videoRef.current.currentTime = startTime;
        }
    };

    const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = type;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percentage * videoDuration;

        if (isDragging.current === 'start') {
            const newStartTime = Math.max(0, Math.min(time, endTime - 0.1));
            setStartTime(newStartTime);
            // Don't update video time while dragging to prevent interruptions
        } else if (isDragging.current === 'end') {
            const newEndTime = Math.min(videoDuration, Math.max(time, startTime + 0.1));
            setEndTime(newEndTime);
        }
    };

    const handleMouseUp = () => {
        if (isDragging.current && videoRef.current) {
            // Update video time only when dragging ends
            if (isDragging.current === 'start') {
                videoRef.current.currentTime = startTime;
            }
            // Pause video during trim adjustments to prevent issues
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
        
        isDragging.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleConvertClick = () => {
        onConvert(startTime, endTime);
    };
    const trimmedDuration = endTime - startTime;

    return (
        <div className={styles.fileInstruction}>
            <h2 className={styles.fileTitle}>
                Selected Video
            </h2>
            <div className={styles.fileList}>
                <div className={gifStyles.videoContainer}>                    <div className={gifStyles.videoPreview}>
                        <video
                            ref={videoRef}
                            src={videoSrc.current || undefined}
                            className={gifStyles.previewVideo}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onLoadedMetadata={() => {
                                if (videoRef.current && !isDragging.current) {
                                    videoRef.current.currentTime = startTime;
                                }
                            }}
                            preload="metadata"
                        />
                        <div className={gifStyles.videoControls}>
                            <button
                                className={gifStyles.playButton}
                                onClick={handleVideoPlay}
                                disabled={isConverting}
                            >
                                {isPlaying ? (
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="4" width="4" height="16" />
                                        <rect x="14" y="4" width="4" height="16" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5,3 19,12 5,21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className={gifStyles.trimmer}>
                        <div className={gifStyles.trimmerLabel}>
                            Select video segment to convert:
                            <p className={gifStyles.videoDuration}>
                                Full Duration: {formatTime(videoDuration)}
                            </p>
                            <p className={gifStyles.trimmedDuration}>
                                Selected: {formatTime(trimmedDuration)} ({formatTime(startTime)} - {formatTime(endTime)})
                            </p>
                        </div>

                        <div className={gifStyles.timeline} ref={progressRef}>
                            <div className={gifStyles.timelineTrack}>
                                <div
                                    className={gifStyles.selectedRange}
                                    style={{
                                        left: `${(startTime / videoDuration) * 100}%`,
                                        width: `${((endTime - startTime) / videoDuration) * 100}%`
                                    }}
                                />
                                <div
                                    className={gifStyles.trimHandle}
                                    style={{ left: `${(startTime / videoDuration) * 100}%` }}
                                    onMouseDown={handleMouseDown('start')}
                                >
                                    <div className={gifStyles.trimHandleIcon}>◀</div>
                                </div>
                                <div
                                    className={gifStyles.trimHandle}
                                    style={{ left: `${(endTime / videoDuration) * 100}%` }}
                                    onMouseDown={handleMouseDown('end')}
                                >
                                    <div className={gifStyles.trimHandleIcon}>▶</div>
                                </div>
                            </div>
                        </div>
                        <div className={gifStyles.timeLabels}>
                            <span>{formatTime(0)}</span>
                            <span>{formatTime(videoDuration)}</span>
                        </div>
                    </div>
                </div>
            </div>      
            <div className={styles.buttonGroup}>
                <div className={styles.buttonWrapper}>
                    <div className={isConverting ? styles.hiddenButton : ''}>
                        <button className={styles.binButton} onClick={onDeleteFile} disabled={isConverting}>
                            <svg
                                className={styles.binTop}
                                viewBox="0 0 39 7"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <line y1="5" x2="39" y2="5" stroke="currentColor" strokeWidth="4"></line>
                                <line
                                    x1="12"
                                    y1="1.5"
                                    x2="26.0357"
                                    y2="1.5"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                ></line>
                            </svg>
                            <svg
                                className={styles.binBottom}
                                viewBox="0 0 33 39"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <mask id="path-1-inside-1_8_19" fill="white">
                                    <path
                                        d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                                    ></path>
                                </mask>
                                <path
                                    d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                                    fill="currentColor"
                                    mask="url(#path-1-inside-1_8_19)"
                                ></path>
                                <path d="M12 6L12 29" stroke="currentColor" strokeWidth="4"></path>
                                <path d="M21 6V29" stroke="currentColor" strokeWidth="4"></path>
                            </svg>
                        </button>
                    </div>

                    <div className={isConverting ? styles.hiddenButton : ''}>
                        <button
                            className={gifStyles.settingsButton}
                            onClick={onSettingsClick}
                            disabled={isConverting}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Settings
                        </button>
                    </div>

                    <button
                        className={`${styles.confirmButton} ${gifStyles.convertButton}`}
                        onClick={handleConvertClick}
                        disabled={isConverting}
                    >
                        {isConverting ? 'Converting...' : 'Convert to GIF'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GifFileInstruction;
