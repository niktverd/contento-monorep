import {getListVideos} from '../../../src/apiUtils/controllers/user';
import {createHandler} from '../../../src/apiUtils/template';

const videos = createHandler({get: getListVideos});

export default videos;
