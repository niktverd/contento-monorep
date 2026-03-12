import {getMediaInsights} from '../../../../src/apiUtils/controllers/instagram';
import {createHandler} from '../../../../src/apiUtils/template';

const handler = createHandler({get: getMediaInsights});
export default handler;
