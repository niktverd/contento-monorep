import React, {useState} from 'react';

import {useAuth} from '../contexts/AuthContext';

import styles from './Home.module.css';

export const Home = () => {
    const [showUserId, setShowUserId] = useState(false);
    const {currentUser} = useAuth();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Instagram Trend Research Tool</h1>
                <p className={styles.subtitle}>
                    Analyze and discover current trending content on Instagram
                </p>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Research Current Trends</h2>
                <p className={styles.paragraph}>
                    This application helps researchers identify and analyze trending content on
                    Instagram. Enter a username or hashtag to fetch recent content and discover
                    what&apos;s currently popular.
                </p>
                <div className={styles.featureBox}>
                    <h3 className={styles.featureHeading}>Key Features:</h3>
                    <ul className={styles.featureList}>
                        <li className={styles.featureItem}>
                            Fetch recent Instagram posts from specific accounts
                        </li>
                        <li className={styles.featureItem}>
                            Analyze trending hashtags and content themes
                        </li>
                        <li className={styles.featureItem}>
                            Download videos for research purposes
                        </li>
                        <li className={styles.featureItem}>Track trend evolution over time</li>
                    </ul>
                </div>
            </section>

            <footer className={styles.footer}>
                <p onClick={() => setShowUserId(true)}>
                    This tool is intended for academic and research purposes only.
                </p>
                {showUserId && <pre>{JSON.stringify(currentUser, null, 2)}</pre>}
            </footer>
        </div>
    );
};
