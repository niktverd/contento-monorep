import {Router as expressRouter} from 'express';

import {pingPong} from './controllers';

const router = expressRouter();

// GET routes
router.get('/ping', pingPong);
router.get('/health', pingPong); // Alias for /ping

export default router;
