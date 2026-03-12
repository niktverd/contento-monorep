import {getPublic} from '../../src/apiUtils/controllers/public';
import {createHandler} from '../../src/apiUtils/template';

const publicHandler = createHandler({
    get: getPublic,
});

export default publicHandler;
