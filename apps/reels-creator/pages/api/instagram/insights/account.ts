import {getAccountInsights} from '../../../../src/apiUtils/controllers/instagram';
import {createHandler} from '../../../../src/apiUtils/template';

const handler = createHandler({get: getAccountInsights});

export default handler;
