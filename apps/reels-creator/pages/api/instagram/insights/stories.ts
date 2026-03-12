import {getStoriesInsights} from '../../../../src/apiUtils/controllers/instagram';
import {createHandler} from '../../../../src/apiUtils/template';

const handler = createHandler({get: getStoriesInsights});
export default handler;
