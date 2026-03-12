import {createVideoHandler} from '../../src/apiUtils/controllers/create-video';
import {createHandler} from '../../src/apiUtils/template';

export const config = {
    api: {
        bodyParser: false,
    },
};

const crop = createHandler({
    post: createVideoHandler,
});

export default crop;
