import React from 'react';
import styles from './giftool.module.css';

const GifToolPage = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Video-Gif Converter</h1>
            <p style={{ fontSize: '3rem'}}>Under Construction. Check back later.</p>
            <div className={styles.spinner}>
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
            </div>
        </div>
    );
};

export default GifToolPage;