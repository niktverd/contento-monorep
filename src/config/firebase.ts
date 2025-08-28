import dotenv from 'dotenv';
import adminApp from 'firebase-admin';
import {FirebaseApp, initializeApp} from 'firebase/app';
import {Firestore, getFirestore} from 'firebase/firestore/lite';
import {FirebaseStorage, getStorage} from 'firebase/storage';

dotenv.config();

const getFirebaseConfig = (): string | undefined => {
    switch (process.env.APP_ENV) {
        case 'cloud-run':
            return process.env.FIREBASE_CONFIG_REELS_CREATOR;
        case 'development':
            return process.env.FIREBASE_CONFIG_PREPROD;
        case 'server-production':
            return process.env.FIREBASE_CONFIG;
        default:
            return process.env.FIREBASE_CONFIG_PREPROD; // Default to preprod
    }
};

const getFirebaseAdminSaConfig = (): string | undefined => {
    switch (process.env.APP_ENV) {
        case 'development':
            return process.env.FIREBASE_ADMIN_SA_CONFIG_PREPROD;
        case 'server-production':
            return process.env.FIREBASE_ADMIN_SA_CONFIG;
        default:
            return process.env.FIREBASE_ADMIN_SA_CONFIG_PREPROD; // Default to preprod
    }
};

const firebaseConfigData: string | undefined = getFirebaseConfig();

const firebaseConfig = JSON.parse(firebaseConfigData || '{}');

const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

const fbAdminSaConfData = getFirebaseAdminSaConfig();
const fbAdminSaConf = JSON.parse(fbAdminSaConfData || '{}');

adminApp.initializeApp({
    credential: adminApp.credential.cert({
        projectId: fbAdminSaConf.project_id,
        clientEmail: fbAdminSaConf.client_email,
        privateKey: fbAdminSaConf.private_key?.replace(/\\n/g, '\n'),
    }),
    // You can add other admin-specific config here if needed
});

export const admin = adminApp;
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);
