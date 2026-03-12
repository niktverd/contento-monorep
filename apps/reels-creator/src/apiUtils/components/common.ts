import {doc, getDoc} from 'firebase/firestore/lite';
import type {NextApiRequest} from 'next';
import {getToken} from 'next-auth/jwt';

import db from '../../../configs/firebase';

const secret = process.env.NEXTAUTH_SECRET;

export const obtainToken = async (req: NextApiRequest) => {
    const token = await getToken({req, secret});
    if (!token?.sub) {
        const errorMessage = 'You must be logged in.';

        throw new Error(errorMessage);
    }

    return token.sub || '';
};

export const getInstagramTokenValue = async (tokenId: string): Promise<string | null> => {
    const userRef = doc(db, 'users', tokenId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        return null;
    }
    const userData = userSnap.data();

    return userData.instagramToken || null;
};
