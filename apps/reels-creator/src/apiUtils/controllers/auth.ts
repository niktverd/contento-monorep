import {createUserWithEmailAndPassword, getAuth, updateProfile} from 'firebase/auth';
import {doc, setDoc} from 'firebase/firestore/lite';

import {firebaseApp, firestore} from '../../../configs/firebase';
import type {Handler} from '../types';

type Data = {
    success: boolean;
    message?: string;
    user?: {
        id: string;
        email: string;
        name?: string;
    };
};

export const registerHandler: Handler<void, Data> = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({success: false, message: 'Method not allowed'});
        return;
    }

    try {
        const {email, password, name} = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
            return;
        }

        // Minimum password requirements
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
            return;
        }

        // Create user in Firebase Auth
        const auth = getAuth(firebaseApp);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user profile if name is provided
        if (name) {
            await updateProfile(user, {
                displayName: name,
            });
        }

        // Store additional user data in Firestore
        await setDoc(doc(firestore, 'users', user.uid), {
            email: user.email,
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString(),
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.uid,
                email: user.email || email,
                name: user.displayName || name,
            },
        });
        return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Registration error:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
            res.status(400).json({
                success: false,
                message: 'Email is already in use',
            });
            return;
        }

        // General error
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred during registration',
        });
        return;
    }
};
