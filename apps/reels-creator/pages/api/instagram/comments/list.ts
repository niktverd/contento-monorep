import {getInstagramPostsComments} from '../../../../src/apiUtils/controllers/instagram';
import {createHandler} from '../../../../src/apiUtils/template';

const handler = createHandler({get: getInstagramPostsComments});
export default handler;
