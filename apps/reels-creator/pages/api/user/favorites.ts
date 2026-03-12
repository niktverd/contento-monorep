import {getFavorites, postFavorites} from '../../../src/apiUtils/controllers/user';
import {createHandler} from '../../../src/apiUtils/template';

const handler = createHandler({get: getFavorites, post: postFavorites});

export default handler;
