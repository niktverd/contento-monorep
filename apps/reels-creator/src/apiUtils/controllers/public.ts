import {doc, getDoc} from 'firebase/firestore/lite';

import db from '../../../configs/firebase';
import type {Handler} from '../types';

export const getPublic: Handler = async (req, res) => {
    const {alreadyLoaded = []} = req.query;
    const pagesRef = doc(db, 'public', 'pages');
    const pagesSnap = await getDoc(pagesRef);
    const pages = pagesSnap.exists() ? pagesSnap.data() : {items: []};

    const array = pages.items.filter((item: {id: string; count: number}) => {
        return !alreadyLoaded.includes(item.id);
    });

    const item = array.length ? array[Math.floor(Math.random() * array.length)] : null;

    const docRef = doc(db, 'public', 'pages', 'items', item.id);
    const itemSnap = await getDoc(docRef);
    const itemData = itemSnap.exists() ? itemSnap.data() : {videos: []};

    res.status(200).json({
        ok: true,
        data: itemData,
    });
};
