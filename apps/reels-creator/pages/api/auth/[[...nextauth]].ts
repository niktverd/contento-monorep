import initNextAuth from 'next-auth';

import {authConfig} from '../../../configs/auth';

const handler = initNextAuth(authConfig);

export default handler;
