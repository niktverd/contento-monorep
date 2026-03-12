/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {FirestoreAdapter as firestoreAdapter} from '@auth/firebase-adapter';
import {cert} from 'firebase-admin/app';
import type {AuthOptions} from 'next-auth';
import type {Adapter} from 'next-auth/adapters';
import keycloakProvider from 'next-auth/providers/keycloak';

const firebasePrivateKey = JSON.parse(
    process.env.FIREBASE_PRIVATE_KEY_ADD || process.env.FIREBASE_PRIVATE_KEY || '{}',
);

export const authConfig: AuthOptions = {
    adapter: firestoreAdapter({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: firebasePrivateKey.value,
        }),
    }) as Adapter,
    providers: [
        keycloakProvider({
            clientId: process.env.KEYCLOAK_ID!,
            clientSecret: process.env.KEYCLOAK_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER,
            authorization: {params: {prompt: 'login'}},
        }),
    ],
    theme: {
        colorScheme: 'dark', // "auto" | "dark" | "light"
        brandColor: '#ff0000', // Hex color code
        logo: '', // Absolute URL to image
        buttonText: '#00ff00', // Hex color code
    },
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
};
