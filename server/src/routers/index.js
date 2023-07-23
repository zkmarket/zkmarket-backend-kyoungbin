import express from 'express';

import dataRouter from './dataRouter';
import utilsRouter from './utilsRouter';

const rootRouter = express.Router();

rootRouter.use('/data', dataRouter);

rootRouter.use('/utils', utilsRouter);

export default rootRouter;