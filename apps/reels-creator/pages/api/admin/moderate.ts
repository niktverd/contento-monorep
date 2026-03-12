import {getModerate} from '../../../src/apiUtils/controllers/admin';
import {createHandler} from '../../../src/apiUtils/template';

const crop = createHandler({
    get: getModerate,
});

export default crop;
