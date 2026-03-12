import {getConnectInstagram} from '../../../src/apiUtils/controllers/user';
import {createHandler} from '../../../src/apiUtils/template';

const connectInstagram = createHandler({get: getConnectInstagram});

export default connectInstagram;
