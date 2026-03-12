/* eslint-disable react/no-unescaped-entities */
/* eslint-disable max-len */
import React from 'react';

import Link from 'next/link';

export default function Policy() {
    return (
        <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
            <h1>Privacy Policy</h1>

            <p>Effective Date: May 15, 2024</p>

            <p>
                This Privacy Policy describes how Reels Creator by Investment Company Temir LLC
                (yew_agency) (the "App," "we," "us," or "our") collects, uses, and shares
                information when you use our App. We are committed to protecting your privacy and
                complying with applicable data protection laws, including Facebook's Platform
                Policies.
            </p>

            <p>
                For information about your rights and responsibilities when using our App, please{' '}
                review our{' '}
                <Link href="/terms" style={{color: '#0066cc', textDecoration: 'underline'}}>
                    Terms of Service
                </Link>
                .
            </p>

            <h2>Information We Collect</h2>

            <p>We may collect the following types of information:</p>
            <ul>
                <li>
                    <b>Information you provide directly:</b> If you create an account, we may
                    collect your name, email address, and profile picture. If you log in with
                    Facebook, we may collect your public profile information, including your name,
                    profile picture, and email address, as permitted by Facebook's Platform
                    Policies.
                </li>
                <li>
                    <b>Automatically collected information:</b> We may collect information about
                    your use of the App, such as your IP address, device type, operating system, and
                    usage patterns. We may also collect information about your interactions with the
                    App's features.
                </li>
                <li>
                    <b>Information from Instagram/Facebook:</b> If you connect your Instagram or
                    Facebook account to our App, we may receive information about you as permitted
                    by Instagram's and Facebook's Platform Policies. This may include your name,
                    profile picture, and other information you have made public on
                    Instagram/Facebook. We will only collect the data necessary to provide the App's
                    functionality, and we will use it only in accordance with this Privacy Policy
                    and Instagram's/Facebook's Platform Policies.
                </li>
            </ul>

            <h2>How We Use Your Information</h2>

            <p>We may use your information for the following purposes:</p>
            <ul>
                <li>To provide and improve the App's functionality.</li>
                <li>To personalize your experience within the App.</li>
                <li>To communicate with you about the App, including updates and support.</li>
                <li>To analyze usage trends and improve the App's performance.</li>
                <li>To provide content creation and editing capabilities for Instagram reels.</li>
                <li>To comply with legal obligations.</li>
            </ul>

            <h2>Sharing Your Information</h2>

            <p>We may share your information with the following categories of third parties:</p>
            <ul>
                <li>
                    <b>Service providers:</b> We may share information with service providers who
                    assist us with hosting, data analysis, and customer support. These service
                    providers are contractually obligated to protect your information.
                </li>
                <li>
                    <b>Legal authorities:</b> We may disclose information to legal authorities if
                    required by law or legal process.
                </li>
                <li>
                    <b>Instagram/Facebook:</b> If you connect your Instagram or Facebook account to
                    our App, we may share information with Instagram/Facebook in accordance with
                    their Platform Policies. This may include sharing your activities within the
                    App.
                </li>
                <li>
                    <b>Business transfers:</b> If we are involved in a merger, acquisition, or sale
                    of all or a portion of our assets, your information may be transferred as part
                    of that transaction.
                </li>
            </ul>

            <h2>Your Choices</h2>

            <p>You may have the following choices regarding your information:</p>
            <ul>
                <li>
                    <b>Access and correction:</b> You may request access to and correction of your
                    information.
                </li>
                <li>
                    <b>Data deletion:</b> You may request deletion of your information. To delete
                    your data or request support, please contact us at{' '}
                    <a href="mailto:contario@unico.rn.it">contario@unico.rn.it</a>. Users who have
                    linked Instagram accounts should refer to our{' '}
                    <Link
                        href="/data-deletion"
                        style={{color: '#0066cc', textDecoration: 'underline'}}
                    >
                        Data Deletion page
                    </Link>{' '}
                    for specific instructions.
                </li>
                <li>
                    <b>Opt-out:</b> You may opt out of receiving certain communications from us.
                </li>
                <li>
                    <b>Instagram/Facebook permissions:</b> You can control the information we
                    receive from Instagram/Facebook through your Instagram/Facebook privacy
                    settings.
                </li>
            </ul>

            <h2>Children's Privacy</h2>

            <p>
                Our App is not directed to children under 13. We do not knowingly collect personal
                information from children under 13. If you become aware that a child under 13 has
                provided us with personal information, please contact us.
            </p>

            <h2>Changes to this Privacy Policy</h2>

            <p>
                We may update this Privacy Policy from time to time. We will post any changes on
                this page and encourage you to review it periodically.
            </p>

            <h2>Contact Us</h2>

            <p>
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:contario@unico.rn.it">contario@unico.rn.it</a>
            </p>
        </div>
    );
}
