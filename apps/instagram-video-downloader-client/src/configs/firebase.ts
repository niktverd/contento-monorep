/* eslint-disable import/no-extraneous-dependencies */
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';

const firebaseConfigData =
    import.meta.env.VITE_APP_ENV === 'dev'
        ? import.meta.env.VITE_FIREBASE_CONFIG_PREPROD
        : import.meta.env.VITE_FIREBASE_CONFIG;

if (!firebaseConfigData) {
    throw new Error('Firebase configuration not found in environment variables');
}

const firebaseConfig = JSON.parse(firebaseConfigData);

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
