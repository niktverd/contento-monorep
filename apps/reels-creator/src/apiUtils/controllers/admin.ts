/* eslint-disable no-console */
import {collection, doc, getDoc, getDocs} from 'firebase/firestore/lite';

import db from '../../../configs/firebase';
import {obtainToken} from '../components/common';
import type {Handler} from '../types';

export const getModerate: Handler = async (req, res) => {
    const tokenId = await obtainToken(req);

    if (!tokenId) {
        res.status(404).json({
            ok: false,
            message: 'tokenId is not provided',
        });

        return;
    }

    const userRef = doc(db, 'users', tokenId);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : {};
    if (!user.admin) {
        res.status(400).json({
            ok: false,
            message: 'not admin',
        });

        return;
    }

    const videoCreatorsColRef = collection(db, 'videos');
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
        return docEnt.data();
    });

    res.status(200).json({
        ok: true,
        data: videoCreators,
    });
};
