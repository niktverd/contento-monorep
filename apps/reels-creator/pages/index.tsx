import React from 'react';

import Link from 'next/link';

import {Navigation} from '../src/navigation';

import styles from '../styles/Home.module.css';

const HomePage = () => {
    return (
        <Navigation>
            <div>
                <div className={styles.container}>
                    <h1 className={styles.pageTitle}>Contario</h1>
                    <p className={styles.pageSubtitle}>
                        Transform your photos and images into engaging videos with customizable
                        templates
                    </p>
                </div>

                <section className={styles.aboutSection}>
                    <div className={styles.container}>
                        <div className={styles.aboutContainer}>
                            <div className={styles.aboutCol}>
                                <h2 className={styles.aboutTitle}>About Contario</h2>
                                <p className={styles.aboutText}>
                                    Contario is a powerful service that transforms your static
                                    images and photos into dynamic, professional-quality videos.
                                    With our intuitive template system, you can create engaging
                                    content for social media, marketing, presentations, and more in
                                    just minutes, not hours.
                                </p>
                            </div>
                            <div className={styles.aboutCol}>
                                <h2 className={styles.aboutTitle}>About Contario</h2>
                                <p className={styles.aboutText}>
                                    Our platform combines ease of use with powerful features,
                                    allowing anyone to create professional videos without technical
                                    skills or expensive software. From storage to direct social
                                    media publishing, we handle the entire workflow.
                                </p>
                                <Link href="/app" className={styles.tryNowButton}>
                                    Try Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.videoSection}>
                    <div className={styles.container}>
                        <div className={styles.videoContainer}>
                            <div className={styles.videoWrapper}>
                                <video className={styles.videoPlayer} controls autoPlay muted loop>
                                    <source
                                        src="https://firebasestorage.googleapis.com/v0/b/reels-creator-15261.appspot.com/o/Gj4FCvO8KhSNJMf1xZwX%2F20240220073522241-output.mp4?alt=media&token=092e4cdb-5c15-4d9e-a5cb-2de486b5fae8"
                                        type="video/mp4"
                                    />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <div className={styles.videoContent}>
                                <h2 className={styles.videoTitle}>Experience the Transformation</h2>
                                <p className={styles.videoDescription}>
                                    Witness the remarkable power of Contario in action with this
                                    demonstration. This captivating video showcases our
                                    platform&apos;s ability to transform ordinary static images into
                                    breathtaking, dynamic visual stories. Each frame is meticulously
                                    enhanced with smooth transitions, professional animations, and
                                    elegant text overlays that bring your content to life in
                                    extraordinary ways. The sophisticated motion effects and
                                    polished aesthetic quality demonstrate the exceptional standard
                                    you can achieve with just a few clicks. This is just a glimpse
                                    of the endless creative possibilities waiting for you with our
                                    intuitive, powerful service.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className={styles.container}>
                    <section>
                        <h2 className={styles.sectionTitle}>Core Features</h2>
                        <p className={styles.sectionSubtitle}>
                            Everything you need to transform photos into compelling videos
                        </p>

                        <div className={styles.featuresGrid}>
                            <div className={styles.featureItem}>
                                <h3>Template-Based Creation</h3>
                                <p>
                                    Choose from dozens of professionally designed templates
                                    optimized for different platforms and purposes.
                                </p>
                            </div>
                            <div className={styles.featureItem}>
                                <h3>Quick Processing</h3>
                                <p>
                                    Our advanced rendering engine creates your videos in minutes,
                                    not hours, without compromising on quality.
                                </p>
                            </div>
                            <div className={styles.featureItem}>
                                <h3>Cloud Storage</h3>
                                <p>
                                    All your videos are securely stored on our cloud servers,
                                    accessible anytime and from any device.
                                </p>
                            </div>
                            <div className={styles.featureItem}>
                                <h3>Direct Publishing</h3>
                                <p>
                                    Publish your finished videos directly to major social media
                                    platforms with just a few clicks.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.templateSection}>
                        <h2 className={styles.sectionTitle}>Video Template Library</h2>
                        <p className={styles.sectionSubtitle}>
                            Professional templates for every need and platform
                        </p>

                        <div className={styles.templateGrid}>
                            <div className={styles.templateItem}>
                                <div className={styles.templateImage}>Social Media Stories</div>
                                <div className={styles.templateContent}>
                                    <h3>Social Media Stories</h3>
                                    <p>
                                        Vertical templates optimized for Instagram, Facebook, and
                                        TikTok stories with dynamic transitions and text animations.
                                    </p>
                                </div>
                            </div>
                            <div className={styles.templateItem}>
                                <div className={styles.templateImage}>Product Showcases</div>
                                <div className={styles.templateContent}>
                                    <h3>Product Showcases</h3>
                                    <p>
                                        Professional templates designed to highlight product
                                        features and benefits with elegant transitions and text
                                        overlays.
                                    </p>
                                </div>
                            </div>
                            <div className={styles.templateItem}>
                                <div className={styles.templateImage}>Promotional Videos</div>
                                <div className={styles.templateContent}>
                                    <h3>Promotional Videos</h3>
                                    <p>
                                        Eye-catching promotional templates with call-to-action
                                        animations and attention-grabbing effects.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <section className={styles.howItWorksSection}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>How It Works</h2>
                        <div className={styles.howItWorksContainer}>
                            <p className={styles.howItWorksText}>
                                Contario makes video creation accessible to everyone with a
                                straightforward process: upload your photos, select a template, and
                                customize as needed. Our system handles the rendering and processing
                                in the background, delivering a professional video in minutes that
                                you can download or publish directly.
                            </p>

                            <div className={styles.stepsContainer}>
                                <div className={styles.stepItem}>
                                    <div className={styles.stepNumber}>1</div>
                                    <h3>Upload Photos</h3>
                                    <p>
                                        Select and upload the images you want to include in your
                                        video
                                    </p>
                                </div>
                                <div className={styles.stepItem}>
                                    <div className={styles.stepNumber}>2</div>
                                    <h3>Choose Template</h3>
                                    <p>Pick from our library of professional video templates</p>
                                </div>
                                <div className={styles.stepItem}>
                                    <div className={styles.stepNumber}>3</div>
                                    <h3>Customize & Render</h3>
                                    <p>
                                        Add text, adjust timing, and let our system render your
                                        video
                                    </p>
                                </div>
                            </div>

                            <Link href="/app" className={styles.actionButton}>
                                See Examples
                            </Link>
                        </div>
                    </div>
                </section>

                <div className={styles.container}>
                    <section className={styles.useCasesSection}>
                        <h2 className={styles.sectionTitle}>Use Cases</h2>
                        <p className={styles.sectionSubtitle}>
                            How different creators and businesses leverage Contario
                        </p>

                        <div className={styles.useCasesGrid}>
                            <div className={styles.useCaseItem}>
                                <h3>Social Media Creators</h3>
                                <p>
                                    Transform photo shoots into engaging video content for higher
                                    engagement and reach across platforms.
                                </p>
                            </div>
                            <div className={styles.useCaseItem}>
                                <h3>E-commerce Businesses</h3>
                                <p>
                                    Create dynamic product videos from product photos to boost
                                    conversion rates and showcase features.
                                </p>
                            </div>
                            <div className={styles.useCaseItem}>
                                <h3>Real Estate Agents</h3>
                                <p>
                                    Turn property photos into virtual tours with location
                                    information and property details.
                                </p>
                            </div>
                            <div className={styles.useCaseItem}>
                                <h3>Marketing Agencies</h3>
                                <p>
                                    Quickly produce client deliverables with professional quality
                                    without extensive video production resources.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.upcomingSection}>
                        <h2 className={styles.sectionTitle}>Upcoming Features</h2>
                        <p className={styles.sectionSubtitle}>
                            Exciting new additions in active development
                        </p>

                        <div className={styles.upcomingGrid}>
                            <div className={styles.upcomingItem}>
                                <h3>AI-Enhanced Editing</h3>
                                <p>
                                    Implementation of advanced AI models to handle increasingly
                                    complex data sources and unstructured content.
                                </p>
                            </div>
                            <div className={styles.upcomingItem}>
                                <h3>Audio Library</h3>
                                <p>
                                    Extensive library of royalty-free music and sound effects to
                                    complement your videos with perfect audio.
                                </p>
                            </div>
                            <div className={styles.upcomingItem}>
                                <h3>Custom Animation Builder</h3>
                                <p>
                                    Create your own animation effects and transitions with an
                                    intuitive drag-and-drop interface.
                                </p>
                            </div>
                            <div className={styles.upcomingItem}>
                                <h3>Team Collaboration</h3>
                                <p>
                                    Collaborative features allowing teams to work together on video
                                    projects with commenting and approval workflows.
                                </p>
                            </div>
                            <div className={styles.upcomingItem}>
                                <h3>Enhanced Data Enrichment</h3>
                                <p>
                                    Advanced capabilities to augment parsed data with relevant
                                    information from complementary sources.
                                </p>
                            </div>
                            <div className={styles.upcomingItem}>
                                <h3>White-Label Solutions</h3>
                                <p>
                                    Enterprise options for agencies and businesses to offer Contario
                                    capabilities under their own brand.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.ctaSection}>
                        <h2 className={styles.ctaTitle}>Start Creating Compelling Videos Today</h2>
                        <p className={styles.ctaText}>
                            Transform your photos into professional videos in minutes with Contario.
                        </p>
                        <Link href="/app" className={styles.getStartedButton}>
                            Get Started
                        </Link>
                    </section>
                </div>

                <section className={styles.metaDisclosureSection}>
                    <div className={styles.container}>
                        <div className={styles.metaDisclosure}>
                            <h3>Meta Tech Provider Disclosure</h3>
                            <p>
                                Contario is a SaaS platform developed by Investment Company Temir
                                LLP that provides businesses and creators with tools to generate and
                                publish engaging video content directly to social media platforms
                                such as Instagram.
                            </p>
                            <p>
                                We act as a Meta Tech Provider, offering services on behalf of our
                                clients. This includes:
                            </p>
                            <ul>
                                <li>
                                    Publishing video content to clients&apos; social media accounts
                                    using Meta APIs
                                </li>
                                <li>Accessing performance analytics and engagement metrics</li>
                            </ul>
                            <p>
                                We only access Meta platform data with the explicit consent of the
                                account owner, in compliance with Meta&apos;s platform policies and
                                data privacy regulations. All data is securely processed and never
                                shared with third parties.
                            </p>
                            <p>
                                Our goal is to empower businesses with professional-grade content
                                creation and social media automation tools.
                            </p>
                        </div>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <div className={styles.container}>
                        <div className={styles.footerContainer}>
                            <p className={styles.footerText}>
                                This project is being developed by Investment Company Temir, Astana,
                                Kazakhstan
                            </p>
                            <p className={styles.footerText}>
                                <a
                                    href="https://unico.rn.it/companies/ict/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.footerLink}
                                >
                                    Visit company website
                                </a>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </Navigation>
    );
};

export default HomePage;
