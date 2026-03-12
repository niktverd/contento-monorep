import {getMedia} from '../../../src/apiUtils/controllers/instagram';
import {createHandler} from '../../../src/apiUtils/template';

const handler = createHandler({get: getMedia});

export default handler;
