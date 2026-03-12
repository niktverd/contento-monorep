/* eslint-disable react/no-unescaped-entities */
/* eslint-disable max-len */
import React from 'react';

import Link from 'next/link';

export default function DataDeletion() {
    return (
        <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
            <h1>User Data Deletion</h1>

            <p>Effective Date: May 15, 2024</p>

            <div
                style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    border: '1px solid #dee2e6',
                }}
            >
                <p style={{fontWeight: 'bold', marginBottom: '10px'}}>
                    Important: These data deletion procedures apply specifically to users who have
                    linked their Instagram accounts to our App for publishing content.
                </p>
                <p>
                    If you have not linked your Instagram account, please refer to our{' '}
                    <Link href="/policy" style={{color: '#0066cc', textDecoration: 'underline'}}>
                        Privacy Policy
                    </Link>{' '}
                    for general data handling practices.
                </p>
            </div>

            <h2>Your Data Deletion Rights</h2>

            <p>
                As a user who has linked their Instagram account to Reels Creator for content
                publishing, you have the right to request the deletion of your personal data that we
                have collected through our App's integration with Instagram. This includes:
            </p>
            <ul>
                <li>Instagram account connection information</li>
                <li>Content creation history and drafts</li>
                <li>Publishing activity logs</li>
                <li>Profile information received through Instagram</li>
                <li>Any cached media content from your Instagram account</li>
            </ul>

            <h2>How to Request Data Deletion</h2>

            <p>You can request deletion of your data through the following methods:</p>

            <h3>1. In-App Deletion</h3>
            <p>
                If you still have access to the App, navigate to Settings → Account → Delete My Data
            </p>

            <h3>2. Email Request</h3>
            <p>
                Send an email to <a href="mailto:contario@unico.rn.it">contario@unico.rn.it</a> with
                the subject line "Data Deletion Request" and include:
            </p>
            <ul>
                <li>Your full name</li>
                <li>Email address associated with your account</li>
                <li>Instagram handle that was linked to our App</li>
                <li>Approximate date when you first linked your Instagram account</li>
            </ul>

            <h2>Deletion Process</h2>

            <p>Upon receiving your deletion request, we will:</p>
            <ul>
                <li>Verify your identity as the account owner</li>
                <li>Disconnect your Instagram account from our App</li>
                <li>Delete all personal data associated with your account</li>
                <li>Remove any cached content or media files</li>
                <li>Delete your user account information</li>
            </ul>

            <p>
                We will process your request within 14 days and send a confirmation email once
                deletion is complete.
            </p>

            <h2>Data Retention Exceptions</h2>

            <p>
                In some cases, we may be legally required to retain certain information for a
                specific period even after processing your deletion request. This may include:
            </p>
            <ul>
                <li>Transaction records for financial auditing purposes</li>
                <li>Information needed for legitimate legal purposes or investigations</li>
                <li>
                    Aggregated and anonymized analytics that cannot be linked back to your identity
                </li>
            </ul>

            <p>
                Any retained information will be handled according to our{' '}
                <Link href="/policy" style={{color: '#0066cc', textDecoration: 'underline'}}>
                    Privacy Policy
                </Link>
                .
            </p>

            <h2>Third-Party Data</h2>

            <p>
                Please note that deleting your data from our App does not delete any content you may
                have published to Instagram using our App. To manage content on Instagram, you need
                to use Instagram's own tools and settings.
            </p>

            <h2>Contact Us</h2>

            <p>
                If you have any questions about data deletion, please contact us at:
                <br />
                <a href="mailto:contario@unico.rn.it">contario@unico.rn.it</a>
            </p>

            <p>
                For more information about how we handle your data, please review our{' '}
                <Link href="/policy" style={{color: '#0066cc', textDecoration: 'underline'}}>
                    Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/terms" style={{color: '#0066cc', textDecoration: 'underline'}}>
                    Terms of Service
                </Link>
                .
            </p>
        </div>
    );
}
