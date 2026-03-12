/* eslint-disable react/no-unescaped-entities */
/* eslint-disable max-len */
import React from 'react';

import Link from 'next/link';

export default function Terms() {
    return (
        <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
            <h1>Terms of Service</h1>

            <p>Effective Date: May 15, 2024</p>

            <p>
                These Terms of Service ("Terms") govern your use of Reels Creator by Investment
                Company Temir LLC LLP (yew_agency) (the "App," "we," "us," or "our"). By using the
                App, you agree to these Terms.
            </p>

            <h2>1. Description of Services</h2>

            <p>
                Reels Creator is an application that provides tools for creating and editing content
                for Instagram reels. The App offers templates, editing features, and publishing
                assistance to help users create engaging content for their Instagram accounts. Our
                services may include:
            </p>
            <ul>
                <li>Content creation tools for Instagram reels</li>
                <li>Template-based editing features</li>
                <li>Media library access for creating reels</li>
                <li>Publishing assistance to Instagram</li>
                <li>Technical support related to the App functionality</li>
            </ul>

            <h2>2. User Responsibility for Content</h2>

            <p>
                You are solely responsible for all content you create, edit, and publish using the
                App. By using our App, you agree that:
            </p>
            <ul>
                <li>
                    You will not use the App to create, edit, or publish content that violates any
                    laws or regulations
                </li>
                <li>You will not infringe on the intellectual property rights of others</li>
                <li>You will not create or share offensive, harmful, or inappropriate content</li>
                <li>
                    You have all necessary rights and permissions for any content you use in your
                    reels
                </li>
                <li>
                    You understand that we are not responsible for how your content is used once
                    published
                </li>
                <li>
                    You will comply with Instagram's and Meta's terms of service when publishing
                    content
                </li>
            </ul>

            <h2>3. Termination Conditions</h2>

            <p>
                We reserve the right to suspend or terminate your access to the App at any time,
                with or without notice, for any reason, including but not limited to:
            </p>
            <ul>
                <li>Violation of these Terms</li>
                <li>
                    Creation or publishing of content that violates our policies or applicable laws
                </li>
                <li>Misuse of the App's features</li>
                <li>Attempting to circumvent technical restrictions</li>
                <li>Non-payment of any applicable fees</li>
                <li>At the request of Meta or Instagram</li>
            </ul>
            <p>
                You may also terminate your use of the App at any time by deleting your account or
                uninstalling the App. To delete your account data, please contact us at{' '}
                <a href="mailto:contario@unico.rn.it">contario@unico.rn.it</a>.
            </p>
            <p>
                Users who have linked their Instagram accounts for content publishing should refer
                to our{' '}
                <Link href="/data-deletion" style={{color: '#0066cc', textDecoration: 'underline'}}>
                    Data Deletion page
                </Link>{' '}
                for specific instructions on how to delete their data.
            </p>

            <h2>4. Meta API Restrictions</h2>

            <p>
                Our App uses Meta (Facebook/Instagram) APIs to provide its services. You acknowledge
                and agree that:
            </p>
            <ul>
                <li>
                    Meta may restrict, limit, or revoke our App's access to their APIs at any time
                </li>
                <li>
                    Such restrictions may affect our ability to provide some or all of the App's
                    features
                </li>
                <li>
                    Meta may take action if they determine that the App or its users are misusing
                    their platforms
                </li>
                <li>
                    We will not be liable for any loss of functionality resulting from Meta's
                    actions
                </li>
                <li>You will comply with all Meta platform policies when using our App</li>
            </ul>

            <h2>5. Limitation of Liability</h2>

            <p>
                The App is provided "as is" without warranties of any kind. We are not liable for
                any damages arising from your use of the App, including but not limited to direct,
                indirect, incidental, or consequential damages.
            </p>

            <h2>6. Changes to Terms</h2>

            <p>
                We may update these Terms from time to time. We will notify you of any material
                changes through the App or by other means. Your continued use of the App after such
                modifications constitutes your acceptance of the updated Terms.
            </p>

            <h2>7. Contact Us</h2>

            <p>
                If you have any questions about these Terms, please contact us at:
                <br />
                <a href="mailto:contario@unico.rn.it">contario@unico.rn.it</a>
            </p>
        </div>
    );
}
