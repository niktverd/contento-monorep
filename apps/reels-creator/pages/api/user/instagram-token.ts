import {
    deleteInstagramToken,
    getInstagramToken,
    saveInstagramToken,
} from '../../../src/apiUtils/controllers/instagram';
import {createHandler} from '../../../src/apiUtils/template';

// async function saveInstagramToken(tokenId: string, instagramToken: string, res: NextApiResponse) {
//     if (!instagramToken) {
//         res.status(400).json({ok: false, message: 'Instagram token is required'});
//         return;
//     }
//     const userRef = doc(db, 'users', tokenId);
//     const userSnap = await getDoc(userRef);
//     const userData = userSnap.exists() ? {...userSnap.data(), instagramToken} : {instagramToken};
//     await setDoc(userRef, userData, {merge: true});
//     res.status(200).json({ok: true, message: 'Instagram token saved successfully'});
// }

// async function getInstagramToken(tokenId: string, res: NextApiResponse) {
//     const instagramToken = await getInstagramTokenValue(tokenId);
//     res.status(200).json({ok: true, instagramToken});
// }

// async function deleteInstagramToken(tokenId: string, res: NextApiResponse) {
//     const userRef = doc(db, 'users', tokenId);
//     const userSnap = await getDoc(userRef);
//     if (!userSnap.exists()) {
//         res.status(404).json({ok: false, message: 'User not found'});
//         return;
//     }
//     const userData = userSnap.data();
//     if (!userData.instagramToken) {
//         res.status(200).json({ok: true, message: 'No Instagram token to delete'});
//         return;
//     }
//     await setDoc(userRef, omit(userData, 'instagramToken'));
//     res.status(200).json({ok: true, message: 'Instagram token deleted successfully'});
// }

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//     try {
//         const tokenId = await obtainToken(req);
//         if (!tokenId) {
//             res.status(404).json({ok: false, message: 'tokenId is not provided'});
//             return;
//         }
//         if (req.method === 'POST') {
//             const {instagramToken} = req.body;
//             await saveInstagramToken(tokenId, instagramToken, res);
//             return;
//         } else if (req.method === 'GET') {
//             await getInstagramToken(tokenId, res);
//             return;
//         } else if (req.method === 'DELETE') {
//             await deleteInstagramToken(tokenId, res);
//             return;
//         }
//         res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
//         res.status(405).json({ok: false, message: `Method ${req.method} Not Allowed`});
//     } catch (error) {
//         console.error('Instagram token API error:', error);
//         res.status(500).json({ok: false, message: 'Internal server error'});
//     }
// };

// export default handler;

const handler = createHandler({
    get: getInstagramToken,
    post: saveInstagramToken,
    delete: deleteInstagramToken,
});

export default handler;
