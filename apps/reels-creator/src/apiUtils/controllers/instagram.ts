/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import {doc, getDoc, setDoc} from 'firebase/firestore/lite';
import {omit} from 'lodash';

import db from '../../../configs/firebase';
import {getInstagramTokenValue, obtainToken} from '../components/common';
import type {Handler} from '../types';

// Utility functions
const log = (message: any) => console.log(message);
const logError = (error: any) => console.error(error);

export const getMedia: Handler = async (req, res) => {
    try {
        const {accessToken} = req.query;

        if (accessToken && typeof accessToken === 'string') {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/ui/get-user-content`,
                {
                    params: {
                        accessToken,
                    },
                },
            );
            return res.status(200).json(response.data);
        }

        const tokenId = await obtainToken(req);
        if (!tokenId) {
            return res.status(401).json({
                ok: false,
                message: 'Authentication required',
            });
        }

        const userRef = doc(db, 'users', tokenId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data().instagramToken) {
            return res.status(400).json({
                ok: false,
                message: 'Instagram token not found. Please connect your Instagram account first.',
            });
        }

        const token = userSnap.data().instagramToken;

        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/ui/get-user-content`,
            {
                params: {
                    accessToken: token,
                },
            },
        );

        return res.status(200).json(response.data);
    } catch (error) {
        log(error);
        logError(error);

        return res.status(500).json({
            ok: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const getAccountInsights: Handler = async (req, res) => {
    try {
        const tokenId = await obtainToken(req);
        if (!tokenId) {
            throw new Error('Authentication required');
        }

        const accessToken = await getInstagramTokenValue(tokenId);

        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error(
                'Instagram token not found. Please connect your Instagram account first.',
            );
        } else {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/ui/get-instagram-account-insights`,
                {
                    params: {
                        accessToken,
                        // pass period here get it from req.query
                        period: req.query.period,
                    },
                },
            );

            res.status(200).json(response.data);
            return;
        }
    } catch (error) {
        log(error);
        logError(error);

        res.status(500).json({
            ok: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const getMediaInsights: Handler = async (req, res) => {
    try {
        const {mediaId} = req.query;
        if (!mediaId) {
            throw new Error('mediaId required');
        }

        const tokenId = await obtainToken(req);
        if (!tokenId) {
            throw new Error('Authentication required');
        }

        const accessToken = await getInstagramTokenValue(tokenId);
        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error(
                'Instagram token not found. Please connect your Instagram account first.',
            );
        }

        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/ui/get-user-content`,
        );

        res.status(200).json(response.data);
        return;
    } catch (error) {
        log(error);
        logError(error);

        res.status(500).json({
            ok: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const getStoriesInsights: Handler = async (req, res) => {
    try {
        const {storyId} = req.query;
        if (!storyId) {
            throw new Error('storyId required');
        }

        const tokenId = await obtainToken(req);
        if (!tokenId) {
            throw new Error('Authentication required');
        }

        const accessToken = await getInstagramTokenValue(tokenId);
        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error(
                'Instagram token not found. Please connect your Instagram account first.',
            );
        }

        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/ui/get-user-content`,
        );

        res.status(200).json(response.data);
        return;
    } catch (error) {
        log(error);
        logError(error);

        res.status(500).json({
            ok: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const getInstagramPostsComments: Handler = async (req, res) => {
    try {
        const tokenId = await obtainToken(req);
        if (!tokenId) {
            throw new Error('Authentication required');
        }

        const accessToken = await getInstagramTokenValue(tokenId);

        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error(
                'Instagram token not found. Please connect your Instagram account first.',
            );
        } else {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/ui/get-all-comments-for-posts`,
                {
                    params: {
                        accessToken,
                    },
                },
            );

            res.status(200).json(response.data);
            return;
        }
    } catch (error) {
        log(error);
        logError(error);

        res.status(500).json({
            ok: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const getInstagramToken: Handler = async (req, res) => {
    const tokenId = await obtainToken(req);
    if (!tokenId) {
        res.status(404).json({ok: false, message: 'tokenId is not provided'});
        return;
    }

    const instagramToken = await getInstagramTokenValue(tokenId);

    res.status(200).json({ok: true, instagramToken});
};

export const saveInstagramToken: Handler = async (req, res) => {
    const tokenId = await obtainToken(req);
    if (!tokenId) {
        res.status(404).json({ok: false, message: 'tokenId is not provided'});
        return;
    }

    const {instagramToken} = req.body;
    if (!instagramToken) {
        res.status(400).json({ok: false, message: 'instagramToken is not provided'});
        return;
    }

    const userRef = doc(db, 'users', tokenId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? {...userSnap.data(), instagramToken} : {instagramToken};
    await setDoc(userRef, userData, {merge: true});
    res.status(200).json({ok: true, message: 'Instagram token saved successfully'});
};

export const deleteInstagramToken: Handler = async (req, res) => {
    const tokenId = await obtainToken(req);
    if (!tokenId) {
        res.status(404).json({ok: false, message: 'tokenId is not provided'});
        return;
    }

    const userRef = doc(db, 'users', tokenId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        res.status(404).json({ok: false, message: 'User not found'});
        return;
    }
    const userData = userSnap.data();
    if (!userData.instagramToken) {
        res.status(200).json({ok: true, message: 'No Instagram token to delete'});
        return;
    }
    await setDoc(userRef, omit(userData, 'instagramToken'));
    res.status(200).json({ok: true, message: 'Instagram token deleted successfully'});
};
