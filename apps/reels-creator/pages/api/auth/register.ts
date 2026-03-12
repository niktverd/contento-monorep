import {registerHandler} from '../../../src/apiUtils/controllers/auth';
import {createHandler} from '../../../src/apiUtils/template';

const register = createHandler({
    post: registerHandler,
});

export default register;
