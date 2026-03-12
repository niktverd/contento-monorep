import {postPublishToInstagram} from '../../../src/apiUtils/controllers/user';
import {createHandler} from '../../../src/apiUtils/template';

const publish = createHandler({post: postPublishToInstagram});

export default publish;
