/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import axios from 'axios';
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from 'firebase/firestore/lite';

import db from '../../../configs/firebase';
import {obtainToken} from '../components/common';
import type {Handler} from '../types';

export const getConnectInstagram: Handler = async (req, res) => {
    try {
        // Extract the Instagram token from query parameters
        const {token, userId} = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({
                ok: false,
                message: 'Instagram token is missing or invalid',
            });
            return;
        }

        // Get the user's ID from the session
        try {
            const tokenId = await obtainToken(req);

            if (!tokenId) {
                res.status(401).json({
                    ok: false,
                    message: 'Authentication required',
                });
                return;
            }

            // Get user document reference
            const userRef = doc(db, 'users', tokenId);
            const userSnap = await getDoc(userRef);

            // Prepare user data with Instagram token and ID
            const userData = userSnap.exists()
                ? {
                      ...userSnap.data(),
                      instagramToken: token,
                      instagramUserId: userId || null,
                  }
                : {
                      instagramToken: token,
                      instagramUserId: userId || null,
                  };

            // Save updated user data
            await setDoc(userRef, userData, {merge: true});

            // Redirect to account page
            res.redirect(302, '/account');
        } catch (error) {
            console.error('Authentication error:', error);
            res.redirect(302, '/account?error=auth_failed');
        }
    } catch (error) {
        console.error('Instagram connection error:', error);
        res.redirect(302, '/account?error=connection_failed');
    }
};

export const getListVideos: Handler = async (req, res) => {
    const tokenId = await obtainToken(req);

    if (!tokenId) {
        res.status(404).json({
            ok: false,
            message: 'tokenId is not provided',
        });

        return;
    }

    const videoCreatorsColRef = collection(db, 'videos', tokenId, 'items');
    const videoCreatorsSnap = await getDocs(videoCreatorsColRef);
    if (videoCreatorsSnap.empty) {
        res.status(200).json({
            ok: true,
            data: [],
        });

        return;
    }

    const videoCreators = videoCreatorsSnap.docs.map((docEnt) => {
        console.log(docEnt.data());
        return {
            ...docEnt.data(),
            id: docEnt.id,
        };
    });

    res.status(200).json({
        ok: true,
        data: videoCreators,
    });
};

export const postPublishToInstagram: Handler = async (req, res) => {
    try {
        const tokenId = await obtainToken(req);

        if (!tokenId) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }

        // Check if user has Instagram token
        const userRef = doc(db, 'users', tokenId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data().instagramToken) {
            res.status(400).json({
                success: false,
                error: 'Instagram token not found. Please connect your Instagram account first.',
            });
            return;
        }

        const accessToken = userSnap.data().instagramToken;
        const {videoUrl, videoId, caption = ''} = req.body;

        if (!videoUrl || !videoId) {
            res.status(400).json({
                success: false,
                error: 'Video URL and video ID are required',
            });
            return;
        }

        // Send request to publish video on Instagram
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_INSTAGRAM_INTEGRATION_BACKEND}/api/instagram/publish-video-from-url`,
                {
                    videoUrl,
                    caption,
                    accessToken,
                },
            );

            // If successful or pending, mark video as published in Firebase
            if (response.data.success || response.data.status === 'pending') {
                // Update video document to mark as published to Instagram
                const videoRef = doc(db, 'videos', tokenId, 'items', videoId);
                await updateDoc(videoRef, {
                    publishedToInstagram: true,
                    instagramPublishDate: new Date().toISOString(),
                    instagramMediaContainerId: response.data.mediaContainerId || null,
                });

                res.status(response.data.success ? 200 : 202).json({
                    ...response.data,
                });
            } else {
                throw new Error(response.data.error || 'Failed to publish to Instagram');
            }
        } catch (error: any) {
            console.error('Instagram publishing error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to publish to Instagram',
            });
        }
    } catch (error: any) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        });
    }
};

export const getFavorites: Handler = async (req, res) => {
    try {
        const tokenId = await obtainToken(req);

        if (!tokenId) {
            res.status(401).json({
                ok: false,
                message: 'Authentication required',
            });
            return;
        }

        // GET method to retrieve user's favorites
        // Get user document reference
        const userRef = doc(db, 'users', tokenId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            res.status(200).json({
                ok: true,
                favorites: [],
            });
            return;
        }

        const userData = userSnap.data();

        res.status(200).json({
            ok: true,
            favorites: userData.favorites || [],
        });
        return;
    } catch (error) {
        console.error('Favorites operation error:', error);
        res.status(500).json({
            ok: false,
            message: 'An error occurred while processing your request',
        });
    }
};

export const postFavorites: Handler = async (req, res) => {
    try {
        const tokenId = await obtainToken(req);

        if (!tokenId) {
            res.status(401).json({
                ok: false,
                message: 'Authentication required',
            });
            return;
        }

        // POST method to add/remove a favorite
        const {mediaId, action} = req.body;

        if (!mediaId) {
            res.status(400).json({
                ok: false,
                message: 'Media ID is required',
            });
            return;
        }

        if (!['add', 'remove'].includes(action)) {
            res.status(400).json({
                ok: false,
                message: 'Action must be either "add" or "remove"',
            });
            return;
        }

        // Get user document reference
        const userRef = doc(db, 'users', tokenId);
        const userSnap = await getDoc(userRef);

        // If user doesn't exist, create a new document with favorites array
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                favorites: action === 'add' ? [mediaId] : [],
            });

            res.status(200).json({
                ok: true,
                message: action === 'add' ? 'Added to favorites' : 'Nothing to remove',
            });
            return;
        }

        // If user exists, update favorites array
        await updateDoc(userRef, {
            favorites: action === 'add' ? arrayUnion(mediaId) : arrayRemove(mediaId),
        });

        res.status(200).json({
            ok: true,
            message: action === 'add' ? 'Added to favorites' : 'Removed from favorites',
        });
        return;
    } catch (error) {
        console.error('Favorites operation error:', error);
        res.status(500).json({
            ok: false,
            message: 'An error occurred while processing your request',
        });
    }
};
